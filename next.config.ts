/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  compiler: {
    styledComponents: true,
  },
};

module.exports = nextConfig;
