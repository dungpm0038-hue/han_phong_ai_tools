import test from "node:test";
import assert from "node:assert/strict";
import { extractPdfInWorker } from "../src/lib/pdf-extract.mjs";
function pdf(pages = 1, text = "Hello Han Phong") {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${Array.from({ length: pages }, (_, i) => `${4 + i * 2} 0 R`).join(" ")}] /Count ${pages} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  for (let i = 0; i < pages; i++) {
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
    );
    const stream = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
    objects.push(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
  }
  let result = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(result));
    result += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(result);
  result += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    result += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  result += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(result));
}
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
