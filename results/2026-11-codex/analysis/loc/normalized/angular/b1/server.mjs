import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist/app/browser");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    if (req.url === "/config.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(
        "window.POKE_API = " +
          JSON.stringify(process.env.API_BASE_URL || "http://localhost:9000") +
          ";",
      );
      return;
    }
    try {
      let file = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
      );
      if (!file.startsWith(root + path.sep))
        file = path.join(root, "index.html");
      try {
        if (!(await stat(file)).isFile()) file = path.join(root, "index.html");
      } catch {
        file = path.join(root, "index.html");
      }
      const body = await readFile(file);
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end("Unable to serve app");
    }
  })
  .listen(Number(process.env.PORT || 3000));
