// Preview hosting only. The app itself is the standalone index.html.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const page = new URL('./index.html', import.meta.url);
createServer(async (request, response) => {
  if (request.url?.split('?')[0] !== '/') {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const html = await readFile(page);
    response.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }).end(html);
  } catch {
    response.writeHead(500).end('Unable to load Interval Pace Planner.');
  }
}).listen(Number(process.env.PORT), '0.0.0.0');
