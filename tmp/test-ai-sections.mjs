#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'codex-ai-test+cms@valbrembana.local';
const PASSWORD = 'CodexTest123!';
const TENANT_ID = '125172d3-f498-439f-a045-61e409dac706';

function log(step, message) {
  console.log(`[${step}] ${message}`);
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickButtonByText(page, text) {
  await page.waitForFunction((needle) => {
    const buttons = [...document.querySelectorAll('button')];
    return buttons.some((button) => button.textContent?.trim().includes(needle));
  }, {}, text);

  await page.evaluate((needle) => {
    const buttons = [...document.querySelectorAll('button')];
    const button = buttons.find((candidate) => candidate.textContent?.trim().includes(needle));
    if (!button) throw new Error(`Button "${needle}" not found`);
    button.click();
  }, text);
}

async function openGlobalChat(page) {
  const expanded = await page.evaluate(() => !!document.querySelector('input[placeholder="Scrivi un prompt..."]'));
  if (!expanded) {
    const openedViaToolbar = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll('button')];
      const toolbarButton = buttons.find((candidate) => {
        const text = candidate.textContent?.trim();
        const title = candidate.getAttribute('title');
        return text === 'AI' || title === 'Assistente AI';
      });

      if (toolbarButton instanceof HTMLButtonElement) {
        toolbarButton.click();
        return true;
      }

      return false;
    });

    if (!openedViaToolbar) {
      await page.evaluate(() => {
        const headers = [...document.querySelectorAll('span')];
        const header = headers.find((candidate) => candidate.textContent?.includes('AI Assistant'));
        if (!header) throw new Error('AI chat header not found');
        header.closest('div[style]')?.click();
      });
    }
  }
  await page.waitForSelector('input[placeholder="Scrivi un prompt..."]');
}

async function sendChatPrompt(page, prompt, timeoutMs = 90000) {
  await openGlobalChat(page);
  const selector = 'input[placeholder="Scrivi un prompt..."]';
  await page.focus(selector);
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Meta');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(prompt, { delay: 15 });
  await page.keyboard.press('Enter');

  await page.waitForFunction(
    () => !document.body.innerText.includes('Sta pensando...'),
    { timeout: timeoutMs }
  ).catch(() => null);
}

async function getFieldState(page, selector) {
  return page.$eval(selector, (element) => {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      return {
        value: element.value,
        checked: element instanceof HTMLInputElement ? element.checked : undefined,
        type: element instanceof HTMLInputElement ? element.type : element.tagName.toLowerCase(),
      };
    }
    throw new Error(`Unsupported element for selector ${selector}`);
  });
}

async function markFieldByLabel(page, labelText, preferredTag = null) {
  const handle = await page.evaluate((needle, tagName) => {
    const isVisible = (element) => {
      if (!(element instanceof HTMLElement)) return false;
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };

    const labels = [...document.querySelectorAll('label')];
    const label = labels.find((candidate) => candidate.textContent?.trim().includes(needle));
    if (!label) return null;

    const container = label.parentElement;
    if (!container) return null;

    const selector = tagName
      ? tagName
      : 'input:not([data-ai-ignore-field-context]), textarea:not([data-ai-ignore-field-context]), select:not([data-ai-ignore-field-context]), button[role="switch"]:not([data-ai-ignore-field-context])';

    const field = [...container.querySelectorAll(selector)].find(isVisible);
    if (!(field instanceof HTMLElement)) return null;

    const marker = `codex-${Math.random().toString(36).slice(2)}`;
    field.setAttribute('data-codex-target', marker);
    return `[data-codex-target="${marker}"]`;
  }, labelText, preferredTag);

  if (!handle) {
    throw new Error(`Field with label "${labelText}" not found`);
  }

  return handle;
}

async function waitForFieldChange(page, selector, previous, timeoutMs = 90000) {
  await page.waitForFunction(
    ({ fieldSelector, prior }) => {
      const element = document.querySelector(fieldSelector);
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
        return false;
      }
      const current = {
        value: element.value,
        checked: element instanceof HTMLInputElement ? element.checked : undefined,
      };
      return JSON.stringify(current) !== JSON.stringify(prior);
    },
    { timeout: timeoutMs },
    { fieldSelector: selector, prior: previous }
  );
}

async function focusField(page, selector) {
  await page.waitForSelector(selector);
  await page.focus(selector).catch(() => null);
  await page.click(selector);
  await wait(250);
}

async function testFocusedFieldFill(page, route, setup, fieldLabel, prompt, preferredTag = null) {
  log('TEST', `Visiting ${route}`);
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2' });
  if (setup) {
    await setup();
  }

  const selector = await markFieldByLabel(page, fieldLabel, preferredTag);
  const previous = await getFieldState(page, selector);
  await focusField(page, selector);
  await openGlobalChat(page);
  await page.waitForFunction((label) => document.body.innerText.includes(label), { timeout: 10000 }, fieldLabel).catch(() => null);

  await sendChatPrompt(page, prompt);
  await waitForFieldChange(page, selector, previous);
  const next = await getFieldState(page, selector);
  log('PASS', `${route} ${fieldLabel} => ${JSON.stringify(next)}`);
  return next;
}

async function login(page) {
  log('AUTH', 'Opening login page');
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    clickButtonByText(page, 'Accedi'),
  ]);

  await page.waitForFunction(() => window.location.pathname.startsWith('/dashboard'), { timeout: 30000 });
  log('AUTH', `Logged in on ${await page.evaluate(() => window.location.pathname)}`);
}

async function runBuilderTest(page) {
  log('BUILDER', 'Opening editor');
  await page.goto(`${BASE_URL}/dashboard/editor`, { waitUntil: 'networkidle2' });
  await page.waitForFunction(
    () => window.location.pathname === '/dashboard/editor' && new URL(window.location.href).searchParams.has('page'),
    { timeout: 45000 }
  );
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((button) => button.textContent?.includes('Salva')),
    { timeout: 30000 }
  );
  const beforeBlocks = await page.$$eval('[data-block-id]', (nodes) => nodes.length);

  await openGlobalChat(page);
  await sendChatPrompt(
    page,
    'Crea una topbar e sotto una fascia a 3 colonne 24/52/24 con una notizia centrale larga e due colonne notizie laterali'
  );

  await page.waitForFunction(
    (countBefore) => document.querySelectorAll('[data-block-id]').length > countBefore,
    { timeout: 90000 },
    beforeBlocks
  );

  await clickButtonByText(page, 'Salva');
  await wait(2500);

  const currentUrl = page.url();
  const pageId = new URL(currentUrl).searchParams.get('page');
  if (!pageId) {
    throw new Error('Editor page id not found in URL after builder test');
  }

  log('BUILDER', `Editor page ${pageId} updated`);
  return pageId;
}

async function fetchSavedPage(pageId) {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('site_pages')
    .select('id, title, slug, blocks')
    .eq('id', pageId)
    .single();

  if (error) throw error;
  return data;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(90000);

  try {
    await login(page);

    const categoryName = await testFocusedFieldFill(
      page,
      '/dashboard/categorie',
      async () => clickButtonByText(page, 'Nuova Categoria'),
      'Nome',
      'Inserisci esattamente: Montagna',
      'input'
    );

    const categoryDescription = await testFocusedFieldFill(
      page,
      '/dashboard/categorie',
      async () => clickButtonByText(page, 'Nuova Categoria'),
      'Descrizione',
      'Inserisci esattamente: Notizie, storie e approfondimenti dal territorio di montagna.',
      'input'
    );

    const bannerPosition = await testFocusedFieldFill(
      page,
      '/dashboard/banner',
      async () => clickButtonByText(page, 'Nuovo Banner'),
      'Posizione',
      'Scegli l’opzione Header',
      'select'
    );

    const eventCategory = await testFocusedFieldFill(
      page,
      '/dashboard/eventi',
      async () => clickButtonByText(page, 'Nuovo Evento'),
      'Categoria',
      'Scegli l’opzione Cultura',
      'select'
    );

    const breakingPriority = await testFocusedFieldFill(
      page,
      '/dashboard/breaking-news',
      async () => clickButtonByText(page, 'Nuova Breaking'),
      'Priorità',
      'Inserisci esattamente: 80',
      'input'
    );

    const builderPageId = await runBuilderTest(page);
    const savedPage = await fetchSavedPage(builderPageId);

    console.log('\n=== RESULTS ===');
    console.log(JSON.stringify({
      categoryName,
      categoryDescription,
      bannerPosition,
      eventCategory,
      breakingPriority,
      builder: {
        pageId: builderPageId,
        title: savedPage.title,
        slug: savedPage.slug,
        blocksCount: Array.isArray(savedPage.blocks) ? savedPage.blocks.length : 0,
        topLevelTypes: Array.isArray(savedPage.blocks) ? savedPage.blocks.map((block) => block.type) : [],
      },
    }, null, 2));
  } finally {
    await browser.close();
  }
}

await main();
