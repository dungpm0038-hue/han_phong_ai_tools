// Run after npm run build. No external accounts: uses disposable local Auth/RPC fixtures.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  mkdtemp,
  readFile,
  readdir,
  copyFile,
  mkdir,
  writeFile,
  rm,
} from "node:fs/promises";
import { dirname, join, resolve, relative, sep } from "node:path";
import { tmpdir } from "node:os";
import { Worker } from "node:worker_threads";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { pdf } from "./fixtures/pdf.mjs";

const root = resolve(import.meta.dirname, "..");
const tracePath = join(
  root,
  ".next/server/app/api/documents/route.js.nft.json",
);
const trace = JSON.parse(await readFile(tracePath, "utf8"));
const traced = trace.files.map((file) => resolve(dirname(tracePath), file));
const parserAssets = traced.filter(
  (file) =>
    file.includes(`${sep}node_modules${sep}pdf-parse${sep}`) ||
    file.includes(`${sep}node_modules${sep}@napi-rs${sep}canvas`),
);
assert.ok(
  parserAssets.some((file) => file.endsWith(`${sep}cjs${sep}pdf.worker.mjs`)),
  "adjacent PDF.js worker must be traced",
);
assert.ok(
  parserAssets.some((file) => file.endsWith(".node")),
  "canvas native runtime must be traced",
);
let workerSource;
for (const name of await readdir(join(root, ".next/server/chunks"))) {
  if (!name.endsWith(".js")) continue;
  const text = await readFile(join(root, ".next/server/chunks", name), "utf8");
  if (!text.includes("requireFromProject")) continue;
  const ast = ts.createSourceFile(
    name,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  function visit(node) {
    if (
      ts.isNewExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "Worker" &&
      node.arguments?.[0] &&
      ts.isNoSubstitutionTemplateLiteral(node.arguments[0])
    ) {
      workerSource = runInNewContext(node.arguments[0].getText(ast));
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
assert.equal(
  typeof workerSource,
  "string",
  "find the actual compiled PDF worker",
);
const isolated = await mkdtemp(join(tmpdir(), "han-phong-pdf-trace-"));
try {
  await writeFile(join(isolated, "package.json"), "{}");
  for (const file of parserAssets) {
    const destination = join(isolated, relative(root, file));
    assert.ok(destination.startsWith(isolated + sep));
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(file, destination);
  }
  const worker = new Worker(workerSource, {
    eval: true,
    workerData: {
      moduleRoot: isolated,
      bytes: pdf(),
      maxChars: 24000,
      maxPages: 80,
    },
    resourceLimits: {
      maxOldGenerationSizeMb: 96,
      maxYoungGenerationSizeMb: 16,
    },
  });
  try {
    const result = await Promise.race([
      once(worker, "message").then(([message]) => message),
      new Promise((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Traced worker timeout")),
          12000,
        );
        timer.unref();
      }),
    ]);
    assert.equal(result.error, undefined);
    assert.match(result.text, /Hello Han Phong/);
    assert.equal(result.totalPages, 1);
  } finally {
    await worker.terminate();
  }
  console.log(
    "PASS: exact compiled worker parses PDF with only traced parser/native assets.",
  );
} finally {
  await rm(isolated, { recursive: true, force: true });
}

const userId = randomUUID();
let saved;
const mock = createServer(async (request, response) => {
  response.setHeader("content-type", "application/json");
  if (request.url === "/auth/v1/user")
    return response.end(
      JSON.stringify({
        id: userId,
        aud: "authenticated",
        role: "authenticated",
        email: "fixture@example.com",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {},
      }),
    );
  if (request.url === "/rest/v1/rpc/reserve_pdf_upload")
    return response.end("true");
  if (request.url === "/rest/v1/rpc/save_pdf_document") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    saved = JSON.parse(Buffer.concat(chunks).toString());
    return response.end(
      JSON.stringify({
        id: randomUUID(),
        name: saved.p_name,
        total_pages: saved.p_total,
        processed_pages: saved.p_processed,
        truncated: saved.p_truncated,
      }),
    );
  }
  response.statusCode = 404;
  response.end(JSON.stringify({ error: "Unknown fixture route" }));
});
await new Promise((resolveListen) =>
  mock.listen(0, "127.0.0.1", resolveListen),
);
const backend = `http://127.0.0.1:${mock.address().port}`;
const portReservation = createServer();
await new Promise((resolveListen) =>
  portReservation.listen(0, "127.0.0.1", resolveListen),
);
const port = portReservation.address().port;
await new Promise((resolveClose) => portReservation.close(resolveClose));
const origin = `http://127.0.0.1:${port}`;
const app = spawn(
  process.execPath,
  [
    join(root, "node_modules/next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: backend,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture-public-key",
      SUPABASE_SERVICE_ROLE_KEY: "fixture-service-key",
      NEXT_PUBLIC_SITE_URL: origin,
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
app.stdout.on("data", (chunk) => {
  logs += chunk;
});
app.stderr.on("data", (chunk) => {
  logs += chunk;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      const response = await fetch(origin);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    if (app.exitCode !== null)
      throw new Error("Production server exited before readiness");
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  assert.ok(ready, `production server ready: ${logs}`);
  const now = Math.floor(Date.now() / 1000);
  const token = [
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ),
    Buffer.from(
      JSON.stringify({
        sub: userId,
        aud: "authenticated",
        role: "authenticated",
        iat: now,
        exp: now + 3600,
      }),
    ).toString("base64url"),
    "fixture-signature",
  ].join(".");
  const session = {
    access_token: token,
    refresh_token: "fixture-refresh",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    user: { id: userId },
  };
  const cookie = `sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const response = await fetch(`${origin}/api/documents`, {
    method: "POST",
    headers: {
      origin,
      "content-type": "application/pdf",
      "x-file-name": "fixture.pdf",
      cookie,
    },
    body: pdf(),
  });
  const result = await response.json();
  assert.equal(
    response.status,
    201,
    `built PDF upload returns 201: ${JSON.stringify(result)}`,
  );
  assert.equal(result.total_pages, 1);
  assert.match(saved.p_text, /Hello Han Phong/);
  assert.equal(saved.p_user, userId);
  console.log(
    "PASS: compiled production /api/documents uploads, parses and saves PDF through local Auth/RPC fixtures.",
  );
} finally {
  app.kill("SIGTERM");
  await Promise.race([
    once(app, "exit"),
    new Promise((resolveExit) =>
      setTimeout(() => {
        app.kill("SIGKILL");
        resolveExit();
      }, 3000).unref(),
    ),
  ]);
  await new Promise((resolveClose) => mock.close(resolveClose));
}
