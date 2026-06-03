const path = require("path");
const dotenv = require("dotenv");

// Load env vars from monorepo root .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@calm-stories/shared", "@calm-stories/db"],
};

module.exports = nextConfig;
