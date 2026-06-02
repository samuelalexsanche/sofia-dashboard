/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production"

const nextConfig = {
  output: "export",
  // En GitHub Pages el repo se sirve en /nombre-repo/
  basePath: isProd ? "/sofia-dashboard" : "",
  assetPrefix: isProd ? "/sofia-dashboard/" : "",
  images: { unoptimized: true },
  trailingSlash: true,
}
module.exports = nextConfig
