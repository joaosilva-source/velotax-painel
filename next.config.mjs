/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Reduzir tamanho do bundle serverless (Vercel/Netlify): não incluir public no trace do servidor
  outputFileTracingExcludes: {
    '*': [
      'public/**',
      '.next/cache/**',
    ],
  },
};

export default nextConfig;
