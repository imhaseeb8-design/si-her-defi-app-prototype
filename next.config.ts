import type { NextConfig } from 'next';

// Same base path as the live app (certifications.si3.space/siherdefi) so routes map 1:1.
const nextConfig: NextConfig = {
  basePath: '/siherdefi',
  devIndicators: false,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'silver-causal-rodent-516.mypinata.cloud' }],
  },
  async redirects() {
    return [
      { source: '/', destination: '/siherdefi', basePath: false, permanent: false },
      // the "Email verified" interstitial was removed; old links go to the profile step
      { source: '/verified', destination: '/profile', permanent: false },
    ];
  },
};

export default nextConfig;
