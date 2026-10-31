import { Worker } from "node:worker_threads";
import { createRequire } from "node:module";
import { MAX_DOCUMENT_CHARS, MAX_PDF_PAGES } from "./limits.mjs";
// Parse in a killable worker. Never execute embedded scripts, fetch PDF URLs, or persist the source file.
/** @param {Uint8Array} bytes
 * @returns {Promise<{text:string,totalPages:number,processedPages:number,truncated:boolean}>}
 */
export async function extractPdfInWorker(bytes) {
  const require = createRequire(import.meta.url);
  const modulePath = require.resolve("pdf-parse");
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      `
   const {parentPort,workerData}=require('node:worker_threads');
   (async()=>{
    const {PDFParse}=require(workerData.modulePath);
    const parser=new PDFParse({data:new Uint8Array(workerData.bytes),isEvalSupported:false});
    try{
     const info=await parser.getInfo();
     if(info.total>workerData.maxPages)throw new Error('TOO_MANY_PAGES');
     const processed=Math.min(info.total,20);
     const result=await parser.getText({partial:Array.from({length:processed},(_,i)=>i+1)});
     const full=result.pages.map(page=>page.text).join('\\n\\n');
     parentPort.postMessage({text:full.slice(0,workerData.maxChars),totalPages:info.total,processedPages:processed,truncated:full.length>workerData.maxChars||processed<info.total});
    }finally{await parser.destroy();}
   })().catch(e=>parentPort.postMessage({error:e.message==='TOO_MANY_PAGES'?'TOO_MANY_PAGES':'INVALID_PDF'}));
  `,
      {
        eval: true,
        workerData: {
          modulePath,
          bytes,
          maxChars: MAX_DOCUMENT_CHARS,
          maxPages: MAX_PDF_PAGES,
        },
        resourceLimits: {
          maxOldGenerationSizeMb: 96,
          maxYoungGenerationSizeMb: 16,
        },
      },
    );
    const timer = setTimeout(() => {
      void worker.terminate();
      reject(new Error("PDF xử lý quá lâu. Hãy dùng tài liệu nhỏ hơn."));
    }, 12000);
    worker.once("message", (value) => {
      clearTimeout(timer);
      void worker.terminate();
      if (value.error)
        reject(
          new Error(
            value.error === "TOO_MANY_PAGES"
              ? "Chỉ hỗ trợ PDF tối đa 80 trang."
              : "PDF không hợp lệ, mã hóa hoặc không được hỗ trợ.",
          ),
        );
      else if (!value.text.trim())
        reject(
          new Error(
            "PDF không có văn bản đọc được. Chưa hỗ trợ OCR tài liệu scan.",
          ),
        );
      else resolve(value);
    });
    worker.once("error", () => {
      clearTimeout(timer);
      reject(new Error("Không thể xử lý PDF trong giới hạn tài nguyên."));
    });
    worker.once("exit", () => {
      clearTimeout(timer);
      reject(new Error("Quá trình xử lý PDF đã bị dừng."));
    });
  });
}
