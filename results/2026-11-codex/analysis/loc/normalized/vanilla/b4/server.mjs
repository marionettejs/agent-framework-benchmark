import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
http
  .createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://localhost").pathname;
    if (pathname === "/config.js") {
      res.setHeader("Content-Type", "text/javascript");
      return res.end(
        `window.API_BASE_URL=${JSON.stringify(process.env.API_BASE_URL || "http://localhost:9000")}`,
      );
    }
    const file = path.resolve(root, "." + decodeURIComponent(pathname));
    try {
      if (!file.startsWith(root + "/")) throw Error();
      const body = await fs.readFile(file);
      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : "text/html",
      );
      res.end(body);
    } catch {
      res.setHeader("Content-Type", "text/html");
      res.end(await fs.readFile(root + "/index.html"));
    }
  })
  .listen(Number(process.env.PORT || 3000));
