export const MAX_JSON_BYTES = 32 * 1024;
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_CHARS = 24000;
export const MAX_PDF_PAGES = 80;
export function hasPdfSignature(bytes) {
  return (
    bytes.length >= 8 &&
    new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-"
  );
}
export async function readLimitedBody(request, maxBytes = MAX_JSON_BYTES) {
  const declared = request.headers.get("content-length");
  if (declared && Number(declared) > maxBytes)
    throw new RangeError("REQUEST_TOO_LARGE");
  if (!request.body) throw new SyntaxError("EMPTY_BODY");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new RangeError("REQUEST_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}
