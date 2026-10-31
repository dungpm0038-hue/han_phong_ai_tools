// Run ONLY against a disposable Supabase project after applying migrations.
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
if (process.env.ALLOW_INTEGRATION_TESTS !== "1")
  throw new Error(
    "Set ALLOW_INTEGRATION_TESTS=1 for a disposable Supabase project.",
  );
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY,
  pub = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key || !pub) throw new Error("Missing Supabase configuration");
const admin = createClient(url, key, { auth: { persistSession: false } });
const ids = [];
function check(result) {
  if (result.error) throw result.error;
  return result.data;
}
try {
  const sessions = [];
  for (let i = 0; i < 2; i++) {
    const email = `integration-${randomUUID()}@example.com`,
      password = `Test-${randomUUID()}!`;
    const { user } = check(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      }),
    );
    ids.push(user.id);
    const client = createClient(url, pub, { auth: { persistSession: false } });
    check(await client.auth.signInWithPassword({ email, password }));
    sessions.push(client);
  }
  const conversation = check(
    await sessions[0]
      .from("conversations")
      .insert({ user_id: ids[0], title: "RLS test" })
      .select()
      .single(),
  );
  assert.equal(
    check(
      await sessions[1]
        .from("conversations")
        .select()
        .eq("id", conversation.id),
    ).length,
    0,
    "cross-user SELECT blocked",
  );
  assert.equal(
    check(
      await sessions[1]
        .from("conversations")
        .update({ title: "intrusion" })
        .eq("id", conversation.id)
        .select(),
    ).length,
    0,
    "cross-user UPDATE blocked",
  );
  assert.equal(
    check(
      await sessions[1]
        .from("conversations")
        .delete()
        .eq("id", conversation.id)
        .select(),
    ).length,
    0,
    "cross-user DELETE blocked",
  );
  assert.ok(
    (
      await sessions[0].rpc("reserve_ai_request", {
        p_user: ids[0],
        p_request: randomUUID(),
        p_tool: "chat",
        p_hash: "a".repeat(64),
      })
    ).error,
    "client quota RPC blocked",
  );
  assert.ok(
    (
      await sessions[0].from("usage_records").insert({
        user_id: ids[0],
        request_id: randomUUID(),
        tool: "writer",
        input_hash: "a".repeat(64),
      })
    ).error,
    "client quota INSERT blocked",
  );
  assert.ok(
    (
      await sessions[0]
        .from("subscriptions")
        .update({ plan: "pro" })
        .eq("user_id", ids[0])
    ).error,
    "client plan escalation blocked",
  );
  const today = new Date().toISOString().slice(0, 10);
  check(
    await admin.from("usage_records").insert(
      Array.from({ length: 14 }, () => ({
        user_id: ids[0],
        request_id: randomUUID(),
        tool: "writer",
        input_hash: "a".repeat(64),
        status: "completed",
        usage_date: today,
        created_at: new Date(Date.now() - 120000).toISOString(),
      })),
    ),
  );
  const requests = Array.from({ length: 12 }, () => randomUUID());
  const results = await Promise.all(
    requests.map((p_request) =>
      admin
        .rpc("reserve_ai_request", {
          p_user: ids[0],
          p_request,
          p_tool: "writer",
          p_hash: "b".repeat(64),
        })
        .then(check),
    ),
  );
  assert.equal(
    results.filter((r) => r.state === "reserved").length,
    1,
    "concurrent reservations do not exceed daily quota",
  );
  const reserved = requests[results.findIndex((r) => r.state === "reserved")];
  const args = {
    p_user: ids[0],
    p_request: reserved,
    p_tool: "writer",
    p_hash: "b".repeat(64),
  };
  assert.equal(
    check(await admin.rpc("reserve_ai_request", args)).state,
    "pending",
    "duplicate does not consume quota",
  );
  assert.equal(
    check(
      await admin.rpc("reserve_ai_request", {
        ...args,
        p_hash: "c".repeat(64),
      }),
    ).state,
    "conflict",
    "mismatched duplicate rejected",
  );
  check(
    await admin.rpc("complete_ai_request", {
      p_user: ids[0],
      p_request: reserved,
      p_result: { text: "test" },
      p_conversation: null,
      p_prompt: "test",
    }),
  );
  assert.equal(
    check(await admin.rpc("reserve_ai_request", args)).result.text,
    "test",
    "completed duplicate replays result",
  );
  const rows = check(
    await admin.from("usage_records").select("id").eq("user_id", ids[0]),
  );
  assert.equal(rows.length, 15);
  console.log(
    "PASS: RLS, privilege boundaries, concurrent quota and idempotency.",
  );
} finally {
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error("Cleanup failed for disposable test account", id);
  }
}
