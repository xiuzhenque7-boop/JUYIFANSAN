import app from "./api/index";
import path from "path";

const PORT = 3000;

// 绑定 Vite 服务中间件或静态提供
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[DEV ENVIRONMENT] Vite development server middleware initialized successfully on Port 3000.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(path.join(process.cwd(), "dist"), () => {}); // Noop or simple handling
    // Express static mapping
    const express = (await import("express")).default;
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[PRODUCTION ENVIRONMENT] Static resource directory 'dist' has been mapped accurately.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express dev-server binds core port ${PORT} efficiently.`);
  });
}

startServer();
