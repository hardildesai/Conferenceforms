import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/ahm',
        destination: '/ahmedabad',
        permanent: true,
      },
      {
        source: '/ahm/:path*',
        destination: '/ahmedabad/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
