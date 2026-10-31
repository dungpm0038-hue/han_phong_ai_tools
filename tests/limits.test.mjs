import test from "node:test";
import assert from "node:assert/strict";
import {
  hasPdfSignature,
  readLimitedBody,
  MAX_JSON_BYTES,
  MAX_PDF_BYTES,
  MAX_DOCUMENT_CHARS,
} from "../src/lib/limits.mjs";
const encode = (s) => new TextEncoder().encode(s);
test("PDF signature rejects renamed HTML, empty and truncated uploads", () => {
  for (const value of [
    "",
    "<html>malware.pdf",
    "%PD",
    "not a PDF",
    "     %PDF-1.7",
  ])
    assert.equal(hasPdfSignature(encode(value)), false);
  assert.equal(hasPdfSignature(encode("%PDF-1.7\n")), true);
});
test("limits bound JSON, PDF and extracted context separately", () => {
  assert.equal(MAX_JSON_BYTES, 32768);
  assert.equal(MAX_PDF_BYTES, 5 * 1024 * 1024);
  assert.equal(MAX_DOCUMENT_CHARS, 24000);
});
test("body reader preserves exact bytes across streaming chunks", async () => {
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(encode('{"a":'));
      c.enqueue(encode('"Tiếng Việt"}'));
      c.close();
    },
  });
  const request = new Request("http://localhost", {
    method: "POST",
    body: stream,
    duplex: "half",
  });
  assert.deepEqual(
    JSON.parse(new TextDecoder().decode(await readLimitedBody(request))),
    { a: "Tiếng Việt" },
  );
});
test("rejects oversized declared content before consuming body", async () => {
  let read = false;
  const request = {
    headers: new Headers({ "content-length": "100" }),
    get body() {
      read = true;
      return null;
    },
  };
  await assert.rejects(readLimitedBody(request, 10), RangeError);
  assert.equal(read, false);
});
test("enforces streamed byte limit even without content-length and cancels source", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(c) {
      c.enqueue(new Uint8Array(7));
      c.enqueue(new Uint8Array(7));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("http://localhost", {
    method: "POST",
    body: stream,
    duplex: "half",
  });
  await assert.rejects(readLimitedBody(request, 10), RangeError);
  assert.equal(cancelled, true);
});
test("enforces streamed limit when content-length under-reports actual bytes", async () => {
  const request = new Request("http://localhost", {
    method: "POST",
    headers: { "content-length": "1" },
    body: encode("12345678901"),
  });
  await assert.rejects(readLimitedBody(request, 10), RangeError);
});
test("exact limit is accepted; empty request is rejected", async () => {
  assert.equal(
    (
      await readLimitedBody(
        new Request("http://localhost", { method: "POST", body: "12345" }),
        5,
      )
    ).length,
    5,
  );
  await assert.rejects(
    readLimitedBody(new Request("http://localhost")),
    SyntaxError,
  );
});
