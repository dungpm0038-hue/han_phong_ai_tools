import Link from "next/link";
import { Zap } from "lucide-react";
export function Brand() {
  return (
    <Link href="/" className="logo" aria-label="Hàn Phong AI Tools — Trang chủ">
      <span className="logo-mark">
        <Zap size={19} fill="currentColor" />
      </span>
      <span>
        Hàn Phong <em>AI Tools</em>
      </span>
    </Link>
  );
}
