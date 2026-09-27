/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optional isolated output directory for builds and previews in synced folders.
  distDir: process.env.LINGUAI_NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["26.13.221.135"],
};

module.exports = nextConfig;
