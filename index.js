#!/usr/bin/env node

/**
 * Simple caching proxy server
 * Author: Yagub bc2024-5
 * Lab 5 - Node.js http module
 */

const http = require("http");
const fs = require("fs").promises;
const path = require("path");
const { Command } = require("commander");
const superagent = require("superagent");

// === Setup Commander for CLI arguments ===
const program = new Command();
program
  .requiredOption("-h, --host <host>", "Server host address")
  .requiredOption("-p, --port <port>", "Server port number")
  .requiredOption("-c, --cache <path>", "Cache directory path");
program.parse(process.argv);
const options = program.opts();

// === Ensure the cache directory exists ===
(async () => {
  try {
    await fs.mkdir(options.cache, { recursive: true });
    console.log(`📁 Cache directory ready: ${options.cache}`);
  } catch (err) {
    console.error("❌ Failed to create cache directory:", err);
    process.exit(1);
  }
})();

// === Create HTTP server ===
const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1); // Example: /200 → "200"
  const filePath = path.join(options.cache, `${code}.jpg`);

  // === Handle GET requests ===
  if (req.method === "GET") {
    try {
      // Try to read from local cache
      const data = await fs.readFile(filePath);
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      res.end(data);
      console.log(`✅ Served from cache: ${code}`);
    } catch {
      // If not found in cache, fetch from http.cat
      console.log(`🪣 Cache miss for ${code}, fetching from https://http.cat/${code}`);
      try {
        const response = await superagent.get(`https://http.cat/${code}`);
        // Save to cache for future requests
        await fs.writeFile(filePath, response.body);
        res.writeHead(200, { "Content-Type": "image/jpeg" });
        res.end(response.body);
        console.log(`🐱 Cached new image for code ${code}`);
      } catch {
        // If fetching failed
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        console.log(`❌ Image not found for code ${code}`);
      }
    }

  // === Handle PUT requests (save or replace image manually) ===
  } else if (req.method === "PUT") {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);
      try {
        await fs.writeFile(filePath, buffer);
        res.writeHead(201, { "Content-Type": "text/plain" });
        res.end("Created");
        console.log(`📝 Image saved to cache: ${filePath}`);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
        console.error("Error writing file:", err);
      }
    });

  // === Handle DELETE requests ===
  } else if (req.method === "DELETE") {
    try {
      await fs.unlink(filePath);
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Deleted");
      console.log(`🗑️  Deleted from cache: ${filePath}`);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      console.log(`⚠️  Cannot delete, file not found: ${filePath}`);
    }

  // === Handle unsupported HTTP methods ===
  } else {
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method Not Allowed");
    console.log(`🚫 Unsupported method: ${req.method}`);
  }
});

// === Start the server ===
server.listen(options.port, options.host, () => {
  console.log(`🚀 Server running at http://${options.host}:${options.port}/`);
  console.log(`💾 Caching directory: ${options.cache}`);
});
