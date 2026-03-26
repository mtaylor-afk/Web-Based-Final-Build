

const nextConfig = {
  // Standalone output bundles the app + node_modules for Docker/Railway deployment
  output: "standalone",

  experimental: {
    serverActions: {
      // Allow server actions from any origin so the app works
      // when accessed via port-forwarding, proxy, or any deployment URL
      allowedOrigins: ["*"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
