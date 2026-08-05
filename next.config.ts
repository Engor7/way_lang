import type { NextConfig } from "next";

const securityHeaders = [
   { key: "X-Content-Type-Options", value: "nosniff" },
   { key: "X-Frame-Options", value: "DENY" },
   { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
   {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=()",
   },
];

const nextConfig: NextConfig = {
   devIndicators: false,
   // нативный модуль — не бандлим, грузим из node_modules как есть
   serverExternalPackages: ["better-sqlite3"],
   headers: async () => [
      {
         source: "/(.*)",
         headers: securityHeaders,
      },
   ],
};

export default nextConfig;
