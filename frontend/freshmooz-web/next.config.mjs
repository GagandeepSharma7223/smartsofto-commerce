/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next-local',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  }
}

export default nextConfig
