import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist/pokedex/browser");
const base = (process.env.API_BASE_URL || "http://localhost:9000").replace(
  /\/$/,
  "",
);
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/config.json") {
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ base }));
      }
      let file = path.join(root, decodeURIComponent(url.pathname));
      if (!file.startsWith(root)) {
        res.writeHead(403);
        return res.end();
      }
      let body;
      try {
        body = await readFile(file);
      } catch {
        file = path.join(root, "index.html");
        body = await readFile(file);
      }
      res.setHeader(
        "Content-Type",
        {
          html: "text/html",
          js: "text/javascript",
          css: "text/css",
          ico: "image/x-icon",
        }[file.split(".").pop()] || "application/octet-stream",
      );
      res.end(body);
    } catch {
      res.writeHead(500);
      res.end("Server error");
    }
  })
  .listen(Number(process.env.PORT || 3000));
