import { Suspense } from "react";
import { Chat } from "@/components/chat";
export const metadata = { title: "AI Chat" };
export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          className="skeleton h-96"
          role="status"
          aria-label="Đang tải AI Chat"
        />
      }
    >
      <Chat />
    </Suspense>
  );
}
