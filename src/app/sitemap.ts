import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/pricing"].map((path) => ({
    url: new URL(
      path || "/",
      process.env.NEXT_PUBLIC_SITE_URL || "https://nghiemhanphong.id.vn",
    ).href,
    changeFrequency: "monthly",
    priority: path ? 0.7 : 1,
  }));
}
