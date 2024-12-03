/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://*.solana.com https://*.helius-rpc.com`
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;