# ADR 008: Security Headers

## Context

Web applications should include security headers to protect against common attacks like clickjacking, MIME sniffing, and unwanted browser features.

## Decision

Configure security headers in `next.config.ts` to be applied to all routes.

## Implementation

```ts
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
}
```

## Headers Explained

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking by blocking the site from being embedded in iframes |
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-sniffing responses away from declared content-type |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls how much referrer information is sent with requests |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables access to device features not needed by the app |

## Notes

- These headers apply to all routes via the `/:path*` source pattern
- Additional headers (like CSP) can be added as needed
- In production with a reverse proxy, some headers may be set at that level instead
