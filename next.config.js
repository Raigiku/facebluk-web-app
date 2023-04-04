/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    ENVIRONMENT: process.env.ENVIRONMENT,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vonpqjzllgoreuqgtkyf.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
