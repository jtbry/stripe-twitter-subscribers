import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/subscribe":
        "http://127.0.0.1:5001/lukiman-twitter-subs/us-central1/subscribe",
      "/api/checkSubscriptionStatus":
        "http://127.0.0.1:5001/lukiman-twitter-subs/us-central1/checkSubscriptionStatus",
    },
  },
});
