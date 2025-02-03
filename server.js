import { serve } from "bun";
import { getAllEmbeddings } from "./db.js";
import { readFile, stat } from "fs/promises";

const apiHandler = async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/points") {
    const all = getAllEmbeddings();
    const points = all
      .filter(row => row.projection_batch_x !== null && row.projection_batch_y !== null)
      .map(row => ({
        filename: row.filename,
        x: row.projection_batch_x,
        y: row.projection_batch_y
      }));

    console.log(`Total points in database: ${all.length}`);
    console.log(`Total valid points sent to client: ${points.length}`);  // Debug

    return new Response(JSON.stringify(points), {
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response("API endpoint not found", { status: 404 });
};

// Universal static file server (serves everything from /public)
const staticHandler = async (req) => {
  const url = new URL(req.url);
  let pathname = url.pathname;
  
  // Decode URL-encoded characters first
  pathname = decodeURI(pathname);
  
  // Clean up the path: remove leading slash and any 'public' prefixes
  pathname = pathname.replace(/^\/+/, ''); // remove leading slashes
  pathname = pathname.replace(/^public\/?/g, ''); // remove any 'public/' prefix
  
  // Handle special cases first
  if (pathname === "" || pathname === "index.html") {
    return serveFile("./index.html");
  } else if (pathname === "client.js") {
    return serveFile("./client.js");
  } else if (pathname === "favicon.ico") {
    return serveFile("./favicon.ico");
  }
  
  // For all other files, serve from public directory
  return serveFile(`./public/${pathname}`);
};

// Helper function to serve files
const serveFile = async (filePath) => {
  try {
    await stat(filePath);
    const file = await readFile(filePath);
    
    // Get file extension and determine content type
    const ext = filePath.split('.').pop();
    const mimeTypes = {
      html: "text/html",
      js: "application/javascript",
      css: "text/css",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      svg: "image/svg+xml",
      gif: "image/gif",
      webp: "image/webp",
      ico: "image/x-icon",
    };
    
    const contentType = mimeTypes[ext] || "application/octet-stream";
    return new Response(file, { headers: { "Content-Type": contentType } });
  } catch (error) {
    console.error(`File not found: ${filePath}`);
    return new Response("File not found", { status: 404 });
  }
};

Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    
    // Handle API requests first
    if (url.pathname.startsWith('/api/')) {
      return apiHandler(req);
    }
    
    // Then handle static files
    return staticHandler(req);
  }
});
