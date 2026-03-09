/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Turbopack es el default en Next.js 16; evita conflicto con next-pwa (webpack)
  turbopack: {},
}

module.exports = nextConfig
