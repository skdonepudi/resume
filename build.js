import fs from 'fs-extra';
import axios from 'axios';
import puppeteer from 'puppeteer';
import { render } from './index.js';

const GIST_ID = 'skdonepudi/61f2e3bba23f31b7d38c66427bffa61d';
const RESUME_PATH = './resume.json';
const DIST_DIR = './dist';
const OUTPUT_HTML = `${DIST_DIR}/index.html`;
const OUTPUT_PDF = `${DIST_DIR}/resume.pdf`;

const PDF_OPTIONS = {
  format: 'A4',
  displayHeaderFooter: false,
  printBackground: true,
  margin: {
    top: '0.4in',
    bottom: '0.4in',
    left: '0.4in',
    right: '0.4in',
  },
};

async function loadResume() {
  if (await fs.pathExists(RESUME_PATH)) {
    console.log('Loading from local "resume.json"');
    return JSON.parse(await fs.readFile(RESUME_PATH, 'utf-8'));
  }

  console.log(`Downloading resume... [${GIST_ID}]`);
  const { data } = await axios.get(
    `https://gist.githubusercontent.com/${GIST_ID}/raw/resume.json`
  );
  return data;
}

async function buildHTML() {
  try {
    await fs.remove(DIST_DIR);
    await fs.ensureDir(DIST_DIR);

    const resume = await loadResume();
    console.log('Rendering...');
    const html = await render(resume);

    console.log('Saving file...');
    await fs.writeFile(OUTPUT_HTML, html, 'utf-8');
    console.log('HTML build complete');
    return html;
  } catch (error) {
    console.error('Error building HTML:', error.message);
    throw error;
  }
}

async function buildPDF(html) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });
    const page = await browser.newPage();

    console.log('Opening puppeteer...');
    await page.setContent(html, { waitUntil: 'networkidle0' });

    console.log('Generating PDF...');
    const pdf = await page.pdf(PDF_OPTIONS);

    console.log('Saving file...');
    await fs.writeFile(OUTPUT_PDF, pdf);
    console.log('PDF build complete');
    return pdf;
  } catch (error) {
    console.error('Error building PDF:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function buildAll() {
  try {
    const html = await buildHTML();
    await buildPDF(html);
    console.log('Build process completed successfully');
  } catch (error) {
    console.error('Build process failed:', error.message);
    process.exit(1);
  }
}

buildAll();
