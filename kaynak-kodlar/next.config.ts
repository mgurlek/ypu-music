import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app shows no images, so switch off the image-optimizer endpoint.
  images: { unoptimized: true },
};

export default nextConfig;
