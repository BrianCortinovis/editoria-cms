#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'codex-ai-test+cms@valbrembana.local';
const PASSWORD = 'CodexTest123!';
const TENANT_ID = '125172d3-f498-439f-a045-61e409dac706';
const PAGE_SLUG = 'homepage';
const PROMPT = 'Homepage testata giornalistica originale con breaking ticker, hero centrale, due colonne laterali, video TG e footer editoriale';

function log(step, message, data) {
  const suffix = data === undefined ? '' : ` ${JSON.stringify(data)}`;
  console.log(`[${step}] ${message}${suffix}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    clickButtonByText(page, 'Accedi'),
  ]);
  await page.waitForFunction(() => window.location.pathname.startsWith('/dashboard'), { timeout: 30000 });
}

async function makeSupabase() {
  const envRaw = await fs.readFile('.env.local', 'utf8');
  const env = Object.fromEntries(
    envRaw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      })
  );

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchHomepageState(supabase) {
  const { data, error } = await supabase
    .from('site_pages')
    .select('id,title,slug,blocks,meta')
    .eq('tenant_id', TENANT_ID)
    .eq('slug', PAGE_SLUG)
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  const supabase = await makeSupabase();
  const before = await fetchHomepageState(supabase);
  log('DB', 'Homepage before', {
    pageId: before.id,
    blocks: Array.isArray(before.blocks) ? before.blocks.length : 0,
    generatedTemplate: before.meta?.layoutLibrary?.generatedTemplate || null,
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(120000);

  try {
    await login(page);
    log('AUTH', 'Logged in');

    await page.goto(`${BASE_URL}/dashboard/layout`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Pagine sito'));

    await clickButtonByText(page, 'Homepage');
    await sleep(500);
    await clickButtonByText(page, 'Builder Layout');
    await page.waitForFunction(() => document.body.innerText.includes('Layout & Template'));
    await clickButtonByText(page, 'AI Layout');
    await page.waitForSelector('textarea');

    await page.evaluate(() => {
      const textareas = [...document.querySelectorAll('textarea')];
      const target = textareas.find((ta) => ta.getAttribute('placeholder')?.includes('Homepage'));
      if (!(target instanceof HTMLTextAreaElement)) throw new Error('AI prompt textarea not found');
      target.value = '';
      target.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const aiSelector = await page.evaluate(() => {
      const textareas = [...document.querySelectorAll('textarea')];
      const target = textareas.find((ta) => ta.getAttribute('placeholder')?.includes('Homepage'));
      if (!(target instanceof HTMLTextAreaElement)) return null;
      const marker = `codex-ai-${Math.random().toString(36).slice(2)}`;
      target.setAttribute('data-codex-ai', marker);
      return `[data-codex-ai="${marker}"]`;
    });

    if (!aiSelector) throw new Error('Failed to mark AI textarea');
    await page.focus(aiSelector);
    await page.keyboard.type(PROMPT, { delay: 10 });
    await clickButtonByText(page, 'Genera');

    await page.waitForFunction(
      () => document.body.innerText.includes('Layout AI applicato alla pagina') || !document.body.innerText.includes('Layout & Template'),
      { timeout: 120000 }
    );
    await sleep(2500);

    const after = await fetchHomepageState(supabase);
    log('DB', 'Homepage after', {
      pageId: after.id,
      blocks: Array.isArray(after.blocks) ? after.blocks.length : 0,
      generatedTemplate: after.meta?.layoutLibrary?.generatedTemplate || null,
    });

    await page.goto(`${BASE_URL}/dashboard/layout`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => document.body.innerText.includes('Libreria Layout'));
    const hasIaCategory = await page.evaluate(() =>
      [...document.querySelectorAll('button')].some((button) => button.textContent?.trim().includes('IA Generated'))
    );
    if (hasIaCategory) {
      await clickButtonByText(page, 'IA Generated');
      await sleep(800);
    }

    const libraryState = await page.evaluate(() => {
      const titles = [...document.querySelectorAll('button div.text-sm.font-semibold.leading-tight')].map((el) => el.textContent?.trim()).filter(Boolean);
      return {
        hasIaCategory: [...document.querySelectorAll('button')].some((button) => button.textContent?.trim().includes('IA Generated')),
        titles,
        bodyHasPromptSnippet: document.body.innerText.includes('Homepage testata giornalistica originale'),
      };
    });

    log('LIBRARY', 'IA Generated state', libraryState);

    const result = {
      beforeBlocks: Array.isArray(before.blocks) ? before.blocks.length : 0,
      afterBlocks: Array.isArray(after.blocks) ? after.blocks.length : 0,
      pageId: after.id,
      pageSlug: after.slug,
      generatedTemplate: after.meta?.layoutLibrary?.generatedTemplate || null,
      libraryState,
    };

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
