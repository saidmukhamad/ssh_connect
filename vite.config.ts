import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = parseInt(env.PORT) ?? 5173;

  return {
    server: { port },
    plugins: [react()],
    resolve: {
      alias: {
        src: path.resolve(__dirname, "./src/"),
        app: path.resolve(__dirname, "./src/app/"),
        "@": path.resolve(__dirname, "./src/shared/@/"),
        shared: path.resolve(__dirname, "./src/shared/"),
        components: path.resolve(__dirname, "./src/components/"),
      },
    },
  };
});
