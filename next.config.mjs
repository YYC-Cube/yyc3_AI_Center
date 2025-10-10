/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 启用构建时ESLint检查以确保代码质量
    ignoreDuringBuilds: false,
  },
  typescript: {
    // 启用构建时TypeScript检查以确保类型安全
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
