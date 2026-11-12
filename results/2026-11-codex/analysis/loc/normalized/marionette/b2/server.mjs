import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
  ".svg": "image/svg+xml",
};
http
  .createServer(async (req, res) => {
    try {
      if (req.url === "/config.json") {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            api: process.env.API_BASE_URL || "http://localhost:9000",
          }),
        );
        return;
      }
      let file = path.join(
        "dist",
        decodeURIComponent(new URL(req.url, "http://local").pathname),
      );
      if (!path.extname(file)) file = "dist/index.html";
      let data;
      try {
        data = await readFile(file);
      } catch {
        file = "dist/index.html";
        data = await readFile(file);
      }
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      res.end(data);
    } catch {
      res.writeHead(500);
      res.end("Server error");
    }
  })
  .listen(Number(process.env.PORT || 3000), "0.0.0.0");
