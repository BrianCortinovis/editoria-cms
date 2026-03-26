#!/usr/bin/env node

import fs from 'node:fs';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'codex-ai-test+cms@valbrembana.local';
const PASSWORD = 'CodexTest123!';
const TENANT_ID = '125172d3-f498-439f-a045-61e409dac706';

function readEnv() {
  const raw = fs.readFileSync('.env.local', 'utf8');
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
  const env = readEnv();
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
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
    page.evaluate(() => {
      const button = [...document.querySelectorAll('button')].find((candidate) =>
        candidate.textContent?.trim().includes('Accedi')
      );
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('Pulsante Accedi non trovato');
      }
      button.click();
    }),
  ]);
}

async function main() {
  const homepageId = await getHomepageId();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    for (const viewport of [
      { width: 1440, height: 1024, name: 'desktop-1440' },
      { width: 1280, height: 900, name: 'desktop-1280' },
      { width: 1180, height: 860, name: 'desktop-1180' },
    ]) {
      const page = await browser.newPage();
      page.setViewport(viewport);
      page.setDefaultTimeout(120000);

      await login(page);
      await page.goto(`${BASE_URL}/dashboard/editor?page=${homepageId}`, { waitUntil: 'domcontentloaded' });
      await new Promise((resolve) => setTimeout(resolve, 1800));

      const data = await page.evaluate(() => {
        const rectJson = (selector) => {
          const el = document.querySelector(selector);
          if (!(el instanceof HTMLElement)) return null;
          const rect = el.getBoundingClientRect();
          return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom,
          };
        };

        return {
          path: window.location.pathname + window.location.search,
          innerWidth: window.innerWidth,
          htmlScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
          mainScrollWidth: document.querySelector('main')?.scrollWidth || null,
          headerScrollWidth: document.querySelector('header')?.scrollWidth || null,
          sidebarRect: rectJson('aside'),
          mainRect: rectJson('main'),
          pageFrameRect: rectJson('.sb-page-frame'),
          pageSurfaceRect: rectJson('[data-page-surface="true"]'),
          bodyText: document.body.innerText.slice(0, 260),
        };
      });

      console.log(`\n=== ${viewport.name} ===`);
      console.log(JSON.stringify(data, null, 2));
      await page.screenshot({ path: `tmp/editor-layout-${viewport.name}.png`, fullPage: false });
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
