import test from "node:test";
import assert from "node:assert/strict";
import { describeProviderError } from "../src/lib/ai-errors.mjs";

test("provider credit exhaustion and temporary rate limiting have different recovery paths", () => {
  const billing = describeProviderError(429, "insufficient_quota");
  const rate = describeProviderError(429, "rate_limit_exceeded");
  assert.equal(billing.status, 503);
  assert.match(billing.error, /billing/);
  assert.equal(rate.status, 429);
  assert.doesNotMatch(rate.error, /billing/);
  assert.notEqual(billing.code, rate.code);
});

test("invalid-key diagnostics direct the owner to server configuration without reflecting credentials", () => {
  const sensitive = "private-upstream-credential-that-must-not-be-reflected";
  const failure = describeProviderError(401, sensitive);
  assert.equal(failure.code, "AI_PROVIDER_AUTH");
  assert.match(failure.error, /Vercel/);
  assert.ok(!JSON.stringify(failure).includes(sensitive));
});

test("model access is distinguishable from generic account permissions", () => {
  const model = describeProviderError(404, "model_not_found");
  const permissions = describeProviderError(403, null);
  assert.match(model.error, /OPENAI_MODEL/);
  assert.notEqual(model.code, permissions.code);
});

test("unknown provider values are replaced by a fixed safe response", () => {
  const untrusted = "secret-value prompt and document contents";
  const failure = describeProviderError(undefined, untrusted);
  assert.equal(failure.status, 502);
  assert.equal(failure.code, "AI_PROVIDER_UNAVAILABLE");
  assert.ok(!JSON.stringify(failure).includes(untrusted));
});
