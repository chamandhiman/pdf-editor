import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  preset: "cloudflare-module",
  cloudflare: {
    nodeCompat: true,
  },
});