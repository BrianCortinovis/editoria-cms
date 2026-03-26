#!/usr/bin/env node

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'codex-ai-test+cms@valbrembana.local';
const PASSWORD = 'CodexTest123!';
const PROMPT = 'Homepage testata giornalistica originale con breaking ticker, hero centrale, due colonne laterali, video TG e footer editoriale';

async function clickByText(page, text) {
  await page.waitForFunction((needle) => [...document.querySelectorAll('button, a')].some((el) => el.textContent?.trim().includes(needle)), {}, text);
  await page.evaluate((needle) => {
    const el = [...document.querySelectorAll('button, a')].find((candidate) => candidate.textContent?.trim().includes(needle));
    if (!(el instanceof HTMLElement)) throw new Error(`Element ${needle} not found`);
    el.click();
  }, text);
}

async function login(page) {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    clickByText(page, 'Accedi'),
  ]);
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
page.setDefaultTimeout(120000);

const events = [];

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/api/ai/dispatch') || url.includes('/api/builder/pages/')) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      body = '<unreadable>';
    }
    events.push({
      kind: 'response',
      url,
      status: response.status(),
      body: body.slice(0, 1200),
    });
  }
});

try {
  await login(page);
  await page.goto(`${BASE_URL}/dashboard/layout`, { waitUntil: 'networkidle2' });
  await clickByText(page, 'Homepage');
  await clickByText(page, 'Builder Layout');
  await clickByText(page, 'AI Layout');
  const selector = await page.evaluate(() => {
    const ta = [...document.querySelectorAll('textarea')].find((el) => el.getAttribute('placeholder')?.includes('Homepage'));
    if (!(ta instanceof HTMLTextAreaElement)) return null;
    ta.setAttribute('data-codex-ai-inspect', '1');
    return 'textarea[data-codex-ai-inspect="1"]';
  });
  if (!selector) throw new Error('AI textarea not found');
  await page.focus(selector);
  await page.keyboard.type(PROMPT, { delay: 10 });
  await clickByText(page, 'Genera');
  await page.waitForTimeout?.(15000);
  await new Promise((resolve) => setTimeout(resolve, 15000));
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log(JSON.stringify({ events, bodySnippet: bodyText.slice(0, 3000) }, null, 2));
} finally {
  await browser.close();
}
