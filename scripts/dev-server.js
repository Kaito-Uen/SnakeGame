import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4173);
const root = process.cwd();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

createServer(async (request, response) => {
  try {
    const urlPath = request.url === "/" ? "/index.html" : request.url;
    const filePath = normalize(join(root, urlPath));
    const file = await readFile(filePath);
    const extension = extname(filePath);

    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "text/plain; charset=utf-8"
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, () => {
  console.log(`Snake dev server running at http://localhost:${port}`);
});