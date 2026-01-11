const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],

  // Explicitly exclude directories from being scanned for routes
  experimental: {
    externalDir: true,
  },

  webpack: (config, { isServer }) => {
    // Exclude worktrees and archive directories from being scanned
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/worktrees/**',
        '**/archive/**',
        '**/.next/**',
      ],
    };

    // Add alias to prevent accidental imports from worktrees
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    return config;
  },
};

module.exports = nextConfig;
