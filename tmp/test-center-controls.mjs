#!/usr/bin/env node

import puppeteer from 'puppeteer';

const BASE = 'http://localhost:3000';
const PAGE_ID = '1df97de1-9d58-41a2-b47d-2c00a6cf04d7';

async function clickButtonByText(page, text) {
  await page.waitForFunction((needle) => {
    return [...document.querySelectorAll('button, a')].some((el) => el.textContent?.trim().includes(needle));
  }, {}, text);

  await page.evaluate((needle) => {
    const el = [...document.querySelectorAll('button, a')].find((candidate) => candidate.textContent?.trim().includes(needle));
    if (!(el instanceof HTMLElement)) throw new Error(`Element "${needle}" not found`);
    el.click();
  }, text);
}

async function login(page) {
  console.log('[center-test] open login');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.type('input[type="email"]', 'codex-ai-test+cms@valbrembana.local');
  await page.type('input[type="password"]', 'CodexTest123!');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    clickButtonByText(page, 'Accedi'),
  ]);
  await page.waitForFunction(() => window.location.pathname.startsWith('/dashboard'), { timeout: 30000 });
  console.log('[center-test] login ok');
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  try {
    await login(page);
    console.log('[center-test] open editor');
    await page.goto(`${BASE}/dashboard/editor?page=${PAGE_ID}`, { waitUntil: 'domcontentloaded' });
    await new Promise((resolve) => setTimeout(resolve, 1200));
    await page.waitForSelector('[data-block-id]');
    console.log('[center-test] blocks loaded');

    const firstId = await page.$eval('[data-block-id]', (el) => el.getAttribute('data-block-id'));
    if (!firstId) {
      throw new Error('Nessun blocco trovato');
    }

    await page.click(`[data-block-id="${firstId}"]`);
    await page.waitForSelector('[title="Centra orizzontale pagina"]');
    console.log('[center-test] controls visible');

    const before = await page.$eval(
      `[data-block-id="${firstId}"]`,
      (el) => getComputedStyle(el).transform
    );

    await page.click('[title="Centra orizzontale pagina"]');
    await new Promise((resolve) => setTimeout(resolve, 400));
    console.log('[center-test] horizontal clicked');

    const afterH = await page.$eval(
      `[data-block-id="${firstId}"]`,
      (el) => getComputedStyle(el).transform
    );

    await page.click('[title="Centra verticale pagina"]');
    await new Promise((resolve) => setTimeout(resolve, 400));
    console.log('[center-test] vertical clicked');

    const afterV = await page.$eval(
      `[data-block-id="${firstId}"]`,
      (el) => getComputedStyle(el).transform
    );

    console.log(JSON.stringify({ firstId, before, afterH, afterV }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
