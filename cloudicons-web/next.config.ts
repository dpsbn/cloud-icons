import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable image optimization
  images: {
    domains: [], // Add domains for external images if needed
    formats: ['image/avif', 'image/webp'],
    // Disable image optimization in development for faster builds
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Enable compression for smaller bundle sizes
  compress: true,

  // Configure webpack for better code splitting
  webpack: (config, { isServer }) => {
    // Only apply these optimizations on the client-side bundle
    if (!isServer) {
      // Optimize chunk splitting for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // Create a framework chunk for Next.js and React
          framework: {
            name: 'framework',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Create a commons chunk for shared code
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          // Create a lib chunk for third-party libraries
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name(module: { context: string }) {
              // Get the package name from the path
              const match = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              );
              const packageName = match?.[1] || 'unknown';

              // Return a chunk name based on the package name
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 10,
            minChunks: 1,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // Enable experimental features for better performance
  experimental: {
    // Enable optimistic updates for faster page transitions
    optimisticClientCache: true,
    // Enable server actions for better performance
    serverActions: {
      bodySizeLimit: '2mb'
    },
  },

  // Configure environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api',
  },

  // Configure output for better static optimization
  output: 'standalone',
};

export default nextConfig;
