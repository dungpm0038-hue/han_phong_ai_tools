"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, LoaderCircle, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generate } from "@/lib/client-api";
export function Writer() {
  const [busy, setBusy] = useState(false),
    [result, setResult] = useState(""),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setResult("");
    try {
      const data = await generate({
        tool: "writer",
        mode: form.get("mode"),
        tone: form.get("tone"),
        prompt: form.get("prompt"),
      });
      setResult(data.text);
      window.dispatchEvent(new Event("usage-changed"));
      toast.success("Nội dung đã sẵn sàng.");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Không thể tạo nội dung.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Ý TƯỞNG CỦA BẠN, NGÔN TỪ PHÙ HỢP</span>
          <h1>AI Writer</h1>
          <p>Từ bản nháp đầu tiên đến nội dung mang dấu ấn riêng.</p>
        </div>
        <span className="pill">
          <PenLine size={12} /> Xưởng viết
        </span>
      </div>
      <div className="tool-layout">
        <form onSubmit={submit} className="panel form-stack">
          <h2>Bạn muốn viết gì?</h2>
          <div>
            <label htmlFor="mode">Loại nội dung</label>
            <select id="mode" name="mode">
              <option value="blog">Bài viết blog</option>
              <option value="social">Caption mạng xã hội</option>
              <option value="email">Email chuyên nghiệp</option>
              <option value="marketing">Nội dung marketing</option>
              <option value="rewrite">Viết lại văn bản</option>
              <option value="summary">Tóm tắt văn bản</option>
            </select>
          </div>
          <div>
            <label htmlFor="tone">Giọng điệu</label>
            <select id="tone" name="tone">
              <option value="professional">Chuyên nghiệp</option>
              <option value="friendly">Thân thiện</option>
              <option value="creative">Sáng tạo</option>
              <option value="concise">Ngắn gọn</option>
            </select>
          </div>
          <div>
            <label htmlFor="prompt">Nội dung hoặc yêu cầu của bạn</label>
            <textarea
              id="prompt"
              name="prompt"
              placeholder="Ví dụ: Viết email đề xuất hợp tác thiết kế website, giọng điệu cởi mở nhưng chuyên nghiệp…"
              rows={7}
              required
              minLength={1}
              maxLength={10000}
            />
            <p className="field-help">
              Càng rõ bối cảnh, kết quả càng gần mong muốn. Tối đa 10.000 ký tự.
            </p>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? (
              <LoaderCircle size={16} className="spinner" />
            ) : (
              <Sparkles size={16} />
            )}{" "}
            {busy ? "Đang tìm ngôn từ…" : "Tạo nội dung"}
          </Button>
          <p className="field-help">
            Mỗi lần tạo thành công sử dụng 1 lượt AI.
          </p>
        </form>
        <section className="panel result-panel" aria-busy={busy}>
          <div className="panel-heading">
            <h2>Bản thảo của bạn</h2>
            {result && (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(result);
                    toast.success("Đã sao chép.");
                  } catch {
                    toast.error(
                      "Không thể sao chép. Bạn có thể chọn văn bản thủ công.",
                    );
                  }
                }}
              >
                <Copy size={14} /> Sao chép
              </Button>
            )}
          </div>
          {error && (
            <div role="alert" className="notice error-notice">
              {error}
            </div>
          )}
          {busy ? (
            <div role="status" aria-label="Đang tạo nội dung">
              {[100, 92, 96, 75, 90, 65].map((w, i) => (
                <div
                  key={i}
                  className="skeleton skeleton-line"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          ) : result ? (
            <div className="output" aria-live="polite">
              {result}
            </div>
          ) : (
            !error && (
              <div className="empty-state my-auto">
                <PenLine size={32} strokeWidth={1} />
                <h2>
                  Mọi bản thảo hay
                  <br />
                  đều bắt đầu từ một ý tưởng.
                </h2>
                <p>
                  Nhập yêu cầu ở bên cạnh. Chúng ta sẽ cùng tìm những ngôn từ
                  đầu tiên.
                </p>
              </div>
            )
          )}
        </section>
      </div>
      <p className="text-xs mt-5">
        Kiểm tra thông tin và điều chỉnh bản thảo trước khi sử dụng. Nội dung
        được gửi tới OpenAI để xử lý.
      </p>
    </>
  );
}
