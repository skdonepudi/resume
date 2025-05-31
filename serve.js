#!/usr/bin/env node
//
// This script will run a local development server. This is useful when
// developing the theme.
//
// Usage:
// `serve.js` to use the default JSONResume example
// `serve.js <filename>` to open a particular resume file

import http from 'http';
import fs from 'fs/promises';
import optimist from 'optimist';
import { render } from './index.js';
import resumeJson from 'resume-schema';

const PORT = 8888;
const HOST = 'localhost';
const { argv } = optimist;

async function loadResume() {
  try {
    if (argv._.length) {
      const data = await fs.readFile(argv._[0], 'utf8');
      return JSON.parse(data);
    }
    return resumeJson;
  } catch (error) {
    console.error('Error loading resume:', error.message);
    throw error;
  }
}

async function handleRequest(req, res) {
  if (req.url === '/') {
    try {
      const resume = await loadResume();
      const html = await render(resume);

      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      });
      res.end(html);
    } catch (error) {
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end('Error rendering resume: ' + error.message);
    }
  } else {
    res.writeHead(404, {
      'Content-Type': 'text/plain',
    });
    res.end('Not found');
  }
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`Preview: http://${HOST}:${PORT}/`);
  console.log('Serving...');
});
