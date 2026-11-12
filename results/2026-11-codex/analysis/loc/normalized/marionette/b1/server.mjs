import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const mime = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".html": "text/html",
};
http
  .createServer(async (req, res) => {
    let name = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    try {
      const file = path.join("dist", name);
      const body = await readFile(file);
      res.setHeader(
        "Content-Type",
        mime[path.extname(file)] || "application/octet-stream",
      );
      res.end(body);
    } catch {
      res.setHeader("Content-Type", "text/html");
      res.end(await readFile("dist/index.html"));
    }
  })
  .listen(process.env.PORT || 3000, "0.0.0.0");
