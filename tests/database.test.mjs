import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
const migration = await readFile(
  new URL("../supabase/migrations/202610310001_initial.sql", import.meta.url),
  "utf8",
);
const first = randomUUID(),
  second = randomUUID();
async function fixture() {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to authenticated,service_role;grant execute on function auth.uid() to authenticated;`);
  await db.exec(migration);
  await db.query("insert into auth.users(id) values($1),($2)", [first, second]);
  return db;
}
async function reserve(
  db,
  user = first,
  id = randomUUID(),
  hash = "a".repeat(64),
) {
  const { rows } = await db.query(
    "select public.reserve_ai_request($1,$2,$3,$4) as result",
    [user, id, "writer", hash],
  );
  return rows[0].result;
}
test("migration compiles and account trigger creates profile and free subscription", async () => {
  const db = await fixture();
  try {
    assert.equal(
      (await db.query("select * from public.profiles")).rows.length,
      2,
    );
    assert.deepEqual(
      (await db.query("select distinct plan from public.subscriptions")).rows,
      [{ plan: "free" }],
    );
  } finally {
    await db.close();
  }
});
test("RLS and grants isolate accounts and protect quota, plan, messages and PDF writes", async () => {
  const db = await fixture();
  try {
    const id = randomUUID();
    await db.query(
      "insert into public.conversations(id,user_id,title) values($1,$2,$3)",
      [id, first, "Private"],
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      second,
    ]);
    await db.exec("set role authenticated");
    assert.equal(
      (await db.query("select * from public.conversations")).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "update public.conversations set title=$1 where id=$2 returning id",
          ["intrusion", id],
        )
      ).rows.length,
      0,
    );
    assert.equal(
      (
        await db.query(
          "delete from public.conversations where id=$1 returning id",
          [id],
        )
      ).rows.length,
      0,
    );
    await assert.rejects(
      db.query(
        "insert into public.conversations(user_id,title) values($1,$2)",
        [first, "attack"],
      ),
      /row-level security/,
    );
    await assert.rejects(reserve(db), /permission denied/);
    await assert.rejects(
      db.query("update public.subscriptions set plan='pro'"),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        "insert into public.usage_records(user_id,request_id,tool,input_hash) values($1,$2,'writer',$3)",
        [second, randomUUID(), "a".repeat(64)],
      ),
      /permission denied/,
    );
    await assert.rejects(
      db.query("update public.profiles set upload_count=0"),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        "insert into public.documents(user_id,name,extracted_text,total_pages,processed_pages,truncated) values($1,'test','x',1,1,false)",
        [second],
      ),
      /permission denied/,
    );
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      first,
    ]);
    assert.equal(
      (await db.query("select * from public.conversations")).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query(
          "update public.profiles set display_name=$1 where id=$2 returning id",
          ["Owner", first],
        )
      ).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});
test("daily reservation rejects the 16th request and idempotency prevents duplicate spend", async () => {
  const db = await fixture();
  try {
    for (let i = 0; i < 14; i++)
      await db.query(
        "insert into public.usage_records(user_id,request_id,tool,input_hash,status,created_at) values($1,$2,'writer',$3,'completed',now()-interval '2 minutes')",
        [first, randomUUID(), "a".repeat(64)],
      );
    const id = randomUUID();
    assert.equal((await reserve(db, first, id)).state, "reserved");
    assert.equal((await reserve(db, first, id)).state, "pending");
    assert.equal(
      (await reserve(db, first, id, "b".repeat(64))).state,
      "conflict",
    );
    assert.equal((await reserve(db)).state, "quota");
    await db.query("select public.complete_ai_request($1,$2,$3,null,$4)", [
      first,
      id,
      JSON.stringify({ text: "hello" }),
      "question",
    ]);
    assert.deepEqual((await reserve(db, first, id)).result, { text: "hello" });
    assert.equal(
      (
        await db.query(
          "select count(*)::int as count from public.usage_records",
        )
      ).rows[0].count,
      15,
    );
    assert.equal((await reserve(db, second)).state, "reserved");
  } finally {
    await db.close();
  }
});
test("failed requests release quota, stale claims expire, minute rate remains bounded", async () => {
  const db = await fixture();
  try {
    const id = randomUUID();
    await reserve(db, first, id);
    await db.query("select public.fail_ai_request($1,$2)", [first, id]);
    assert.equal((await reserve(db, first, id)).state, "failed");
    const stale = randomUUID();
    await reserve(db, first, stale);
    await db.query(
      "update public.usage_records set created_at=now()-interval '6 minutes' where request_id=$1",
      [stale],
    );
    await reserve(db);
    assert.equal((await reserve(db, first, stale)).state, "failed");
    await reserve(db);
    await reserve(db);
    await reserve(db);
    assert.equal((await reserve(db)).state, "rate");
  } finally {
    await db.close();
  }
});
test("chat persistence and quota finalize atomically; foreign ownership rolls back", async () => {
  const db = await fixture();
  try {
    const conversation = randomUUID(),
      request = randomUUID();
    await db.query(
      "insert into public.conversations(id,user_id,title) values($1,$2,'test')",
      [conversation, first],
    );
    await reserve(db, first, request);
    await db.query(
      "update public.usage_records set tool='chat' where request_id=$1",
      [request],
    );
    await db.query("select public.complete_ai_request($1,$2,$3,$4,$5)", [
      first,
      request,
      JSON.stringify({ text: "answer" }),
      conversation,
      "question",
    ]);
    assert.deepEqual(
      (
        await db.query(
          "select role,content from public.messages order by created_at",
        )
      ).rows,
      [
        { role: "user", content: "question" },
        { role: "assistant", content: "answer" },
      ],
    );
    const other = randomUUID();
    await reserve(db, second, other);
    // complete requires tool=chat to store messages; reserve above used writer.
    await db.query(
      "update public.usage_records set tool='chat' where user_id=$1",
      [second],
    );
    await assert.rejects(
      db.query("select public.complete_ai_request($1,$2,$3,$4,$5)", [
        second,
        other,
        JSON.stringify({ text: "attack" }),
        conversation,
        "attack",
      ]),
      /foreign key/,
    );
    assert.equal((await reserve(db, second, other)).state, "conflict");
    assert.equal(
      (await db.query("select count(*)::int as count from public.messages"))
        .rows[0].count,
      2,
    );
  } finally {
    await db.close();
  }
});
test("PDF attempt rate is enforced in database", async () => {
  const db = await fixture();
  try {
    for (let i = 0; i < 3; i++)
      assert.equal(
        (
          await db.query("select public.reserve_pdf_upload($1) as allowed", [
            first,
          ])
        ).rows[0].allowed,
        true,
      );
    assert.equal(
      (
        await db.query("select public.reserve_pdf_upload($1) as allowed", [
          first,
        ])
      ).rows[0].allowed,
      false,
    );
    assert.equal(
      (
        await db.query("select public.reserve_pdf_upload($1) as allowed", [
          second,
        ])
      ).rows[0].allowed,
      true,
    );
  } finally {
    await db.close();
  }
});

test("final PDF insertion atomically enforces retained document capacity", async () => {
  const db = await fixture();
  try {
    for (let i = 0; i < 20; i++) {
      const { rows } = await db.query(
        "select public.save_pdf_document($1,$2,$3,1,1,false) as doc",
        [first, `doc-${i}`, "text"],
      );
      assert.ok(rows[0].doc.id);
    }
    const { rows } = await db.query(
      "select public.save_pdf_document($1,'overflow','text',1,1,false) as doc",
      [first],
    );
    assert.equal(rows[0].doc, null);
    assert.equal(
      (await db.query("select count(*)::int as count from public.documents"))
        .rows[0].count,
      20,
    );
  } finally {
    await db.close();
  }
});
