#!/usr/bin/env node

const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const { Command } = require("commander");

const program = new Command();
program
  .requiredOption("-h, --host <host>", "Server host")
  .requiredOption("-p, --port <port>", "Server port")
  .requiredOption("-c, --cache <path>", "Cache directory path");
program.parse(process.argv);
const options = program.opts();

(async () => {
  try {
    await fs.mkdir(options.cache, { recursive: true });
  } catch (err) {
    console.error("Error creating cache:", err);
  }

  const server = http.createServer(async (req, res) => {
    const code = req.url.slice(1); // e.g. /200 → "200"
    const filePath = path.join(options.cache, `${code}.jpg`);

    if (req.method === "GET") {
      try {
        const data = await fs.readFile(filePath);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(data);
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }

    } else if (req.method === "PUT") {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", async () => {
        const buffer = Buffer.concat(chunks);
        await fs.writeFile(filePath, buffer);
        res.writeHead(201, { "Content-Type": "text/plain" });
        res.end("Created");
      });

    } else if (req.method === "DELETE") {
      try {
        await fs.unlink(filePath);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Deleted");
      } catch {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }

    } else {
      res.writeHead(405, { "Content-Type": "text/plain" });
      res.end("Method Not Allowed");
    }
  });

  server.listen(options.port, options.host, () => {
    console.log(`🚀 Server running at http://${options.host}:${options.port}/`);
  });
})();
