/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-5e947aef5d7446cba7a0e57a0dc13d6e.r2.dev',
      },
    ],
  },
};

module.exports = nextConfig;
