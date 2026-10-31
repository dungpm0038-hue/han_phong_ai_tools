export async function api<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(typeof options.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Máy chủ trả về dữ liệu không hợp lệ." }));
  if (!response.ok)
    throw new Error(data.error || "Yêu cầu thất bại. Vui lòng thử lại.");
  return data as T;
}
export type Conversation = { id: string; title: string; created_at: string };
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
};
export type DocumentInfo = {
  id: string;
  name: string;
  total_pages: number;
  processed_pages: number;
  truncated: boolean;
};
export type AIResult = { text: string; requestId: string };
export async function generate(
  body: Record<string, unknown>,
  requestId = crypto.randomUUID(),
) {
  return api<AIResult>("/api/ai", {
    method: "POST",
    headers: { "Idempotency-Key": requestId },
    body: JSON.stringify(body),
  });
}
