// server.js
import { serve } from "bun";
import { getAllEmbeddings } from "./db.js";
import { readFile } from "fs/promises";

const apiHandler = async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/api/points") {
    const all = getAllEmbeddings();
    const points = all
      .filter(row => row.projection_batch_x !== null && row.projection_batch_y !== null)
      .map(row => ({
        id: row.id,
        x: row.projection_batch_x,
        y: row.projection_batch_y
      }));

    console.log(`Total points in database: ${all.length}`);
    console.log(`Total valid points sent to client: ${points.length}`);  // Debug

    return new Response(JSON.stringify(points), {
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response("Not found", { status: 404 });
};


// Serve index.html directly from root directory
const staticHandler = async (req) => {
  const url = new URL(req.url);
  
  if (url.pathname === "/" || url.pathname === "/index.html") {
    try {
      const file = await readFile("./index.html");
      return new Response(file, { headers: { "Content-Type": "text/html" } });
    } catch (e) {
      return new Response("index.html not found", { status: 404 });
    }
  }

  if (url.pathname === "/client.js") {
    try {
      const file = await readFile("./client.js");
      return new Response(file, { headers: { "Content-Type": "application/javascript" } });
    } catch (e) {
      return new Response("client.js not found", { status: 404 });
    }
  }

  return new Response("Not found", { status: 404 });
};

Bun.serve({
  port: 3000,
  async fetch(req) {
    return req.url.includes("/api/") ? apiHandler(req) : staticHandler(req);
  }
});
