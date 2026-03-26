import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    plugins: [react()],
    base: isProd
      ? "/CSE442/2025-Fall/cse-442ac/app/dist/"
      : "/", // <-- localhost behaves normally
  };
});
