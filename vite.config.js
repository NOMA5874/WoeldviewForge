import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      // 核心契约：拦截所有 /api 请求并移交后端处理
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
