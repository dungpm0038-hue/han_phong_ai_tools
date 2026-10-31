import "server-only";
import { extractPdfInWorker } from "./pdf-extract.mjs";
import { HttpError } from "./http";
export async function extractPdf(bytes: Uint8Array) {
  try {
    return await extractPdfInWorker(bytes);
  } catch (e) {
    throw new HttpError(
      422,
      e instanceof Error ? e.message : "Không thể xử lý PDF.",
    );
  }
}
