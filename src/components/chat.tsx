"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  LoaderCircle,
  MessageSquare,
  PenLine,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  api,
  generate,
  type Conversation,
  type Message,
} from "@/lib/client-api";
export function Chat() {
  const params = useSearchParams();
  const requested = params.get("conversation");
  const [conversations, setConversations] = useState<Conversation[]>([]),
    [active, setActive] = useState<string | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [prompt, setPrompt] = useState(""),
    [error, setError] = useState(""),
    [renaming, setRenaming] = useState(false),
    [title, setTitle] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const selection = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const selectConversation = useCallback(async (id: string | null) => {
    const version = ++selection.current;
    setActive(id);
    setMessages([]);
    setLoading(!!id);
    setError("");
    setRenaming(false);
    setConfirmDelete(false);
    if (!id) return;
    try {
      const data = await api<Message[]>(`/api/conversations/${id}`);
      if (version === selection.current) setMessages(data);
    } catch (e) {
      if (version === selection.current)
        setError(e instanceof Error ? e.message : "Không thể tải lịch sử.");
    } finally {
      if (version === selection.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let alive = true;
    async function initialize() {
      try {
        const list = await api<Conversation[]>("/api/conversations");
        if (!alive) return;
        setConversations(list);
        await selectConversation(
          requested && list.some((c) => c.id === requested)
            ? requested
            : list[0]?.id || null,
        );
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message : "Không thể tải lịch sử.");
          setLoading(false);
        }
      }
    }
    void initialize();
    return () => {
      alive = false;
    };
  }, [requested, selectConversation]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "instant" });
  }, [messages, busy]);
  async function create() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const conversation = await api<Conversation>("/api/conversations", {
        method: "POST",
        body: "{}",
      });
      setConversations((items) => [conversation, ...items]);
      await selectConversation(conversation.id);
      inputRef.current?.focus();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Không thể tạo cuộc trò chuyện.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!active || !prompt.trim() || busy) return;
    setBusy(true);
    setError("");
    const text = prompt.trim();
    try {
      const result = await generate({
        tool: "chat",
        conversationId: active,
        prompt: text,
      });
      setMessages((items) => [
        ...items,
        { id: crypto.randomUUID(), role: "user", content: text },
        { id: result.requestId, role: "assistant", content: result.text },
      ]);
      setPrompt("");
      window.dispatchEvent(new Event("usage-changed"));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Không thể gửi tin nhắn.";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }
  async function rename(event: React.FormEvent) {
    event.preventDefault();
    if (!active) return;
    setBusy(true);
    try {
      await api(`/api/conversations/${active}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });
      setConversations((items) =>
        items.map((c) => (c.id === active ? { ...c, title } : c)),
      );
      setRenaming(false);
      toast.success("Đã đổi tên.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể đổi tên.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!active) return;
    setBusy(true);
    try {
      await api(`/api/conversations/${active}`, { method: "DELETE" });
      const rest = conversations.filter((c) => c.id !== active);
      setConversations(rest);
      await selectConversation(rest[0]?.id || null);
      toast.success("Đã xóa cuộc trò chuyện.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xóa.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">MỘT CÂU HỎI, MỘT HƯỚNG ĐI MỚI</span>
          <h1>AI Chat</h1>
          <p>Một khoảng trống để suy nghĩ, khám phá và tìm lời giải.</p>
        </div>
        <span className="pill">
          <Sparkles size={12} /> Trợ lý của bạn
        </span>
      </div>
      <div className="chat-layout">
        <aside
          className="conversation-list"
          aria-label="Lịch sử cuộc trò chuyện"
        >
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={create}
            disabled={busy}
          >
            <Plus size={14} /> Cuộc trò chuyện mới
          </Button>
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`conversation-item ${active === c.id ? "selected" : ""}`}
              disabled={busy}
              aria-pressed={active === c.id}
              onClick={() => void selectConversation(c.id)}
            >
              <MessageSquare size={13} />
              <span>{c.title}</span>
            </button>
          ))}
          {!loading && !conversations.length && (
            <p className="text-xs p-3 mt-3">Lịch sử sẽ xuất hiện ở đây.</p>
          )}
        </aside>
        <section className="chat-main" aria-busy={busy || loading}>
          <div className="chat-toolbar">
            {renaming ? (
              <form onSubmit={rename} className="flex gap-2 w-full">
                <label className="sr-only" htmlFor="conversation-title">
                  Tên cuộc trò chuyện
                </label>
                <input
                  id="conversation-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  minLength={1}
                  required
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Lưu tên"
                  disabled={busy}
                >
                  <Check size={16} />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Hủy đổi tên"
                  onClick={() => setRenaming(false)}
                >
                  <X size={16} />
                </Button>
              </form>
            ) : (
              <>
                <span className="truncate max-w-50">
                  {conversations.find((c) => c.id === active)?.title ||
                    "AI Chat"}
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!active || busy}
                    onClick={() => {
                      setTitle(
                        conversations.find((c) => c.id === active)?.title || "",
                      );
                      setRenaming(true);
                    }}
                  >
                    <PenLine size={12} /> Đổi tên
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={!active || busy}
                    aria-label="Xóa cuộc trò chuyện"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </>
            )}
          </div>
          {confirmDelete && (
            <div role="alert" className="notice error-notice m-3">
              Xóa vĩnh viễn cuộc trò chuyện này?
              <div className="flex gap-3 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={remove}
                >
                  Xóa cuộc trò chuyện
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete(false)}
                >
                  Giữ lại
                </Button>
              </div>
            </div>
          )}
          <div
            className="chat-messages"
            role="log"
            aria-label="Tin nhắn"
            aria-live="polite"
          >
            {loading ? (
              <div role="status" aria-label="Đang tải lịch sử">
                {[80, 60, 90].map((w) => (
                  <div
                    key={w}
                    className="skeleton skeleton-line"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            ) : messages.length ? (
              messages.map((message) => (
                <div
                  className={`chat-message ${message.role}`}
                  key={message.id}
                >
                  <span
                    className="avatar"
                    aria-label={message.role === "user" ? "Bạn" : "AI"}
                  >
                    {message.role === "user" ? "B" : "✳"}
                  </span>
                  <div className="output">{message.content}</div>
                </div>
              ))
            ) : (
              <div className="empty-state my-auto">
                <Sparkles size={32} strokeWidth={1} />
                <h2>
                  Ý tưởng tiếp theo
                  <br />
                  bắt đầu từ đây.
                </h2>
                <p>
                  {active
                    ? "Đặt một câu hỏi, chia sẻ một ý tưởng hoặc cùng tìm một góc nhìn khác."
                    : "Tạo cuộc trò chuyện mới để bắt đầu."}
                </p>
                {!active && (
                  <Button onClick={create} disabled={busy} size="sm">
                    <Plus size={14} /> Bắt đầu trò chuyện
                  </Button>
                )}
              </div>
            )}
            {busy && !renaming && (
              <div
                className="status-inline flex gap-2 items-center"
                role="status"
              >
                <LoaderCircle size={14} className="spinner" /> Đang xử lý…
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="chat-composer">
            {error && (
              <div className="notice error-notice" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={send}>
              <label htmlFor="chat-prompt" className="sr-only">
                Tin nhắn của bạn
              </label>
              <textarea
                ref={inputRef}
                id="chat-prompt"
                rows={1}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  active
                    ? "Hỏi bất cứ điều gì bạn đang nghĩ…"
                    : "Tạo một cuộc trò chuyện để bắt đầu…"
                }
                maxLength={6000}
                required
                disabled={!active || busy || loading}
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Gửi tin nhắn"
                disabled={!active || busy || loading || !prompt.trim()}
              >
                <Send size={16} />
              </Button>
            </form>
            <p>
              AI có thể mắc lỗi. Ngữ cảnh AI dùng tối đa 12 tin nhắn gần nhất /
              18.000 ký tự.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
