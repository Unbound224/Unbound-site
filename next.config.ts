import type { NextConfig } from 'next';

/**
 * Optional same-origin proxy to unbound-core. Core sends no CORS headers, so a browser on another origin cannot call it
 * directly. With CORE_PROXY_TARGET=http://127.0.0.1:3001 and NEXT_PUBLIC_API_URL=/core, the browser calls this site's
 * /core/* and Next forwards it server-side. Leave both unset when core is served from the same origin by other means.
 */
const coreProxyTarget = process.env.CORE_PROXY_TARGET?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    return coreProxyTarget ? [{ source: '/core/:path*', destination: `${coreProxyTarget}/:path*` }] : [];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
