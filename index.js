#!/usr/bin/env node

// === Import modules ===
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Command } = require("commander");

// === Setup Commander.js ===
const program = new Command();
program
  .requiredOption("-h, --host <host>", "Server host address")
  .requiredOption("-p, --port <port>", "Server port number")
  .requiredOption("-c, --cache <path>", "Cache directory path");

program.parse(process.argv);
const options = program.opts();

// === Ensure cache directory exists ===
if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
  console.log(`📁 Created cache directory: ${options.cache}`);
}

// === Create HTTP server ===
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Proxy server is running...");
});

// === Start server ===
server.listen(options.port, options.host, () => {
  console.log(`🚀 Server running at http://${options.host}:${options.port}/`);
});
