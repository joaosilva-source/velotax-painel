/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Reduzir tamanho da função serverless (limite Netlify 250 MB): não incluir public no bundle do servidor
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'public/**',
        '.next/cache/**',
      ],
    },
  },
};

export default nextConfig;
