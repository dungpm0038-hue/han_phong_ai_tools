import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  // The parser is loaded inside an eval worker, outside Next's static module graph.
  // Include its adjacent PDF.js worker and the canvas native runtime explicitly.
  outputFileTracingIncludes: {
    "/api/documents": [
      "./node_modules/pdf-parse/package.json",
      "./node_modules/pdf-parse/dist/pdf-parse/cjs/**/*",
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-*/**/*",
    ],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'" +
              (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") +
              "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://*.supabase.co" +
              (process.env.NODE_ENV === "development" ? " ws: wss:" : "") +
              "; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};
export default config;
