import test from "node:test";
import assert from "node:assert/strict";
import { extractPdfInWorker } from "../src/lib/pdf-extract.mjs";
import { pdf } from "./fixtures/pdf.mjs";
test("worker extracts an actual PDF and reports complete scope", async () => {
  const result = await extractPdfInWorker(pdf());
  assert.match(result.text, /Hello Han Phong/);
  assert.equal(result.totalPages, 1);
  assert.equal(result.processedPages, 1);
  assert.equal(result.truncated, false);
});
test("worker processes first 20 pages and explicitly reports truncation", async () => {
  const result = await extractPdfInWorker(pdf(22));
  assert.equal(result.totalPages, 22);
  assert.equal(result.processedPages, 20);
  assert.equal(result.truncated, true);
});
test("worker rejects PDF beyond the 80 page cap", async () => {
  await assert.rejects(extractPdfInWorker(pdf(81)), /80 trang/);
});
test("worker rejects malformed content despite valid-looking PDF magic", async () => {
  await assert.rejects(
    extractPdfInWorker(new TextEncoder().encode("%PDF-1.7\nmalformed")),
    /PDF/,
  );
});
test("worker rejects scan-like PDF without extractable text", async () => {
  await assert.rejects(extractPdfInWorker(pdf(1, "")), /không có văn bản/);
});
