"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  FileText,
  LoaderCircle,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, generate, type DocumentInfo } from "@/lib/client-api";
export function PdfTool() {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]),
    [selected, setSelected] = useState<DocumentInfo | null>(null),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [output, setOutput] = useState(""),
    [question, setQuestion] = useState(""),
    [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    api<DocumentInfo[]>("/api/documents")
      .then((d) => {
        if (alive) {
          setDocuments(d);
          setSelected(d[0] || null);
        }
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  function fail(e: unknown) {
    const message =
      e instanceof Error ? e.message : "Không thể xử lý tài liệu.";
    setError(message);
    toast.error(message);
  }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("file");
    if (!(file instanceof File)) return;
    if (file.type !== "application/pdf") {
      fail(new Error("Chỉ chấp nhận tệp PDF."));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      fail(new Error("PDF phải nhỏ hơn hoặc bằng 4 MB."));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const doc = await api<DocumentInfo>("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
          "X-File-Name": encodeURIComponent(file.name),
        },
        body: file,
      });
      setDocuments((d) => [doc, ...d]);
      setSelected(doc);
      setOutput("");
      form.reset();
      toast.success("Đã đọc phần văn bản PDF.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function ask(prompt: string) {
    if (!selected) return;
    setBusy(true);
    setError("");
    setOutput("");
    try {
      const data = await generate({
        tool: "pdf",
        documentId: selected.id,
        prompt,
      });
      setOutput(data.text);
      window.dispatchEvent(new Event("usage-changed"));
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    try {
      await api("/api/documents", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      const rest = documents.filter((d) => d.id !== id);
      setDocuments(rest);
      if (selected?.id === id) {
        setSelected(rest[0] || null);
        setOutput("");
      }
      setDeleting(null);
      toast.success("Đã xóa văn bản tài liệu.");
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">
            ĐỌC ÍT THỜI GIAN HƠN. HIỂU THÊM MỘT CHÚT.
          </span>
          <h1>AI PDF</h1>
          <p>Tìm ý chính và đặt câu hỏi từ phần văn bản được trích xuất.</p>
        </div>
        <span className="pill">
          <FileText size={12} /> Thư viện cá nhân
        </span>
      </div>
      <div className="notice">
        Tối đa 4 MB / tệp, 80 trang. Xử lý tối đa{" "}
        <strong>20 trang đầu và 24.000 ký tự</strong>. Chưa hỗ trợ OCR hoặc tìm
        kiếm toàn bộ PDF. Tệp gốc không được lưu; chỉ lưu phần văn bản đã trích.
      </div>
      {error && (
        <div role="alert" className="notice error-notice">
          {error}
        </div>
      )}
      <div className="tool-layout">
        <section className="panel">
          <h2 className="text-base">Tài liệu của bạn</h2>
          <form onSubmit={upload} className="form-stack">
            <div className="drop-area">
              <Upload size={24} strokeWidth={1} />
              <label htmlFor="pdf-file">Chọn một tài liệu PDF</label>
              <input
                id="pdf-file"
                name="file"
                type="file"
                accept="application/pdf,.pdf"
                required
                disabled={busy}
              />
              <p className="field-help">
                PDF có văn bản, không mã hóa · Tối đa 4 MB
              </p>
            </div>
            <Button type="submit" variant="outline" disabled={busy}>
              {busy ? (
                <LoaderCircle size={14} className="spinner" />
              ) : (
                <Upload size={14} />
              )}{" "}
              Tải lên và đọc PDF
            </Button>
          </form>
          <div className="document-list" aria-busy={loading}>
            {loading ? (
              <div
                className="skeleton h-20"
                role="status"
                aria-label="Đang tải tài liệu"
              />
            ) : documents.length ? (
              documents.map((doc) => (
                <div
                  className={`document-item ${selected?.id === doc.id ? "selected" : ""}`}
                  key={doc.id}
                >
                  <FileText size={17} />
                  <button
                    disabled={busy}
                    onClick={() => {
                      setSelected(doc);
                      setOutput("");
                      setQuestion("");
                      setError("");
                    }}
                    aria-pressed={selected?.id === doc.id}
                  >
                    <span className="block truncate">{doc.name}</span>
                    <small>
                      {doc.processed_pages}/{doc.total_pages} trang ·{" "}
                      {doc.truncated
                        ? "Đã giới hạn nội dung"
                        : "Trong giới hạn xử lý"}
                    </small>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={busy}
                    aria-label={`Xóa ${doc.name}`}
                    onClick={() => setDeleting(doc.id)}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-xs">
                Thư viện đang chờ tài liệu đầu tiên của bạn.
              </p>
            )}
          </div>
          {deleting && (
            <div className="notice mt-4" role="alert">
              Xóa văn bản tài liệu đã lưu?
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => remove(deleting)}
                >
                  Xóa tài liệu
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleting(null)}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </section>
        <section className="panel result-panel">
          <div className="panel-heading">
            <h2>{selected?.name || "Góc đọc tài liệu"}</h2>
            {output && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sao chép kết quả"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(output);
                    toast.success("Đã sao chép.");
                  } catch {
                    toast.error("Không thể sao chép.");
                  }
                }}
              >
                <Copy size={14} />
              </Button>
            )}
          </div>
          {selected && (
            <>
              <div className="notice">
                Nguồn: {selected.processed_pages}/{selected.total_pages} trang.{" "}
                {selected.truncated
                  ? "Nội dung đã bị cắt; kết quả chỉ dựa trên phần đã xử lý."
                  : "Văn bản nằm trong giới hạn xử lý; bố cục hoặc bảng có thể trích xuất thiếu."}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="self-start mb-5"
                disabled={busy}
                onClick={() =>
                  ask(
                    "Tóm tắt các ý chính và các điểm cần lưu ý trong phần văn bản tài liệu đã được cung cấp.",
                  )
                }
              >
                <Sparkles size={13} /> Tóm tắt phần đã đọc
              </Button>
            </>
          )}
          {busy ? (
            <div role="status">
              <p className="status-inline">Đang xử lý…</p>
              {[95, 80, 90, 60].map((w) => (
                <div
                  key={w}
                  className="skeleton skeleton-line"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : output ? (
            <div className="output mb-6" aria-live="polite">
              {output}
            </div>
          ) : (
            <div className="empty-state my-auto">
              <FileText size={32} strokeWidth={1} />
              <h2>Mở ra một góc nhìn rõ hơn.</h2>
              <p>
                {selected
                  ? "Tóm tắt hoặc đặt câu hỏi về phần tài liệu đã được đọc."
                  : "Tải tài liệu lên để bắt đầu khám phá nội dung."}
              </p>
            </div>
          )}
          <form
            className="mt-auto flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) void ask(question);
            }}
          >
            <label htmlFor="pdf-question" className="sr-only">
              Câu hỏi về tài liệu
            </label>
            <input
              id="pdf-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Đặt câu hỏi về phần đã đọc…"
              maxLength={4000}
              required
              disabled={busy || !selected}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Gửi câu hỏi về PDF"
              disabled={busy || !selected || !question.trim()}
            >
              <Send size={15} />
            </Button>
          </form>
        </section>
      </div>
      <p className="text-xs mt-5">
        Phần văn bản tài liệu được gửi tới OpenAI khi bạn hỏi hoặc tóm tắt. Xóa
        tài liệu để xóa phần trích trong thư viện; bản sao ngữ cảnh hoặc kết quả
        đã lưu có chính sách lưu trữ riêng, xem README.
      </p>
    </>
  );
}
