#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'codex-ai-test+cms@valbrembana.local';
const PASSWORD = 'CodexTest123!';
const TENANT_SLUG = 'valbrembana';
const TENANT_ID = '125172d3-f498-439f-a045-61e409dac706';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1024 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readEnv() {
  const raw = await fs.readFile('.env.local', 'utf8');
  return Object.fromEntries(
    raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  );
}

async function getHomepageId() {
  const env = await readEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('site_pages')
    .select('id')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', 'homepage')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Homepage non trovata');
  }

  return data.id;
}

async function login(page) {
  console.log('[responsive] login');
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.evaluate(() => {
      const button = [...document.querySelectorAll('button, a')].find((candidate) =>
        candidate.textContent?.trim().includes('Accedi')
      );
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('Pulsante Accedi non trovato');
      }
      button.click();
    }),
  ]);

  await page.waitForFunction(() => window.location.pathname.startsWith('/dashboard'), { timeout: 30000 });
}

async function measure(page, url, viewport) {
  console.log(`[responsive] ${viewport.name} -> ${url}`);
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await wait(1200);
  await page.evaluate(() => window.scrollTo(0, 0));

  return page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const main = document.querySelector('main');

    return {
      path: window.location.pathname + window.location.search,
      innerWidth: window.innerWidth,
      htmlScrollWidth: html.scrollWidth,
      bodyScrollWidth: body.scrollWidth,
      mainScrollWidth: main instanceof HTMLElement ? main.scrollWidth : null,
      hasHorizontalOverflow:
        html.scrollWidth > window.innerWidth + 2 ||
        body.scrollWidth > window.innerWidth + 2,
      visibleText: document.body.innerText.slice(0, 220),
    };
  });
}

async function main() {
  const homepageId = await getHomepageId();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  try {
    await login(page);

    const urls = [
      `${BASE_URL}/dashboard`,
      `${BASE_URL}/dashboard/pagine`,
      `${BASE_URL}/dashboard/layout`,
      `${BASE_URL}/dashboard/editor?page=${homepageId}`,
      `${BASE_URL}/site/${TENANT_SLUG}`,
      `${BASE_URL}/site/${TENANT_SLUG}/motore-render-stress`,
    ];

    const results = [];

    for (const viewport of VIEWPORTS) {
      for (const url of urls) {
        results.push({
          viewport: viewport.name,
          ...(await measure(page, url, viewport)),
        });
      }
    }

    console.log(JSON.stringify(results, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
