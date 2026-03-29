#!/usr/bin/env node

import puppeteer from 'puppeteer';

const BASE_URL = 'http://127.0.0.1:3000';
const EMAIL = 'briancortinovis@gmail.com';
const PASSWORD = '12345678';

function log(step, message) {
  console.log(`[${step}] ${message}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickByText(page, text, selector = 'button, a') {
  await page.waitForFunction(
    ({ needle, nodeSelector }) => {
      const nodes = [...document.querySelectorAll(nodeSelector)];
      return nodes.some((node) => node.textContent?.trim().includes(needle));
    },
    {},
    { needle: text, nodeSelector: selector },
  );

  await page.evaluate(
    ({ needle, nodeSelector }) => {
      const nodes = [...document.querySelectorAll(nodeSelector)];
      const node = nodes.find((candidate) => candidate.textContent?.trim().includes(needle));
      if (!(node instanceof HTMLElement)) {
        throw new Error(`Elemento "${needle}" non trovato`);
      }
      node.click();
    },
    { needle: text, nodeSelector: selector },
  );
}

async function openGlobalChat(page) {
  const inputSelector = 'input[placeholder="Scrivi un prompt..."]';
  const alreadyOpen = await page.$(inputSelector);
  if (alreadyOpen) return;

  await page.evaluate(() => {
    const widgets = [...document.querySelectorAll('div.fixed.bottom-4.right-4')];
    const widget = widgets.find((candidate) => candidate.textContent?.includes('AI Assistant'));
    const clickable = widget?.querySelector('div.cursor-pointer');
    if (!(clickable instanceof HTMLElement)) {
      throw new Error('Header cliccabile AI non trovato');
    }
    clickable.click();
  });

  await page.waitForSelector(inputSelector, { timeout: 15000 });
}

async function markFieldByLabel(page, labelText) {
  const selector = await page.evaluate((needle) => {
    const labels = [...document.querySelectorAll('label')];
    const label = labels.find((candidate) => candidate.textContent?.trim().includes(needle));
    if (!(label instanceof HTMLElement)) return null;

    const scope = label.parentElement;
    if (!scope) return null;

    const field = scope.querySelector('input:not([type="hidden"]), textarea, select, button[role="switch"]');
    if (!(field instanceof HTMLElement)) return null;

    const marker = `codex-target-${Math.random().toString(36).slice(2)}`;
    field.setAttribute('data-codex-target', marker);
    return `[data-codex-target="${marker}"]`;
  }, labelText);

  if (!selector) {
    throw new Error(`Campo con label "${labelText}" non trovato`);
  }

  return selector;
}

async function getFieldValue(page, selector) {
  return page.$eval(selector, (node) => {
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
      return node.value;
    }
    return '';
  });
}

async function focusField(page, selector) {
  await page.waitForSelector(selector);
  await page.click(selector);
  await delay(250);
}

async function getMessages(page) {
  return page.evaluate(() => {
    const bubbles = [...document.querySelectorAll('div.max-w-xs')];
    return bubbles.map((bubble) => bubble.textContent?.trim() || '').filter(Boolean);
  });
}

async function sendPrompt(page, prompt) {
  await openGlobalChat(page);
  const selector = 'input[placeholder="Scrivi un prompt..."]';
  await page.focus(selector);
  await page.keyboard.down('Meta');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Meta');
  await page.keyboard.press('Backspace');
  await page.keyboard.type(prompt, { delay: 10 });

  const beforeMessages = await getMessages(page);
  await page.keyboard.press('Enter');

  await page.waitForFunction(
    (previousCount) => {
      const bubbles = [...document.querySelectorAll('div.max-w-xs')];
      return bubbles.length > previousCount && !document.body.innerText.includes('Sta pensando...');
    },
    { timeout: 90000 },
    beforeMessages.length,
  );

  const afterMessages = await getMessages(page);
  return afterMessages.at(-1) || '';
}

async function login(page) {
  log('AUTH', 'Apro login locale');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    clickByText(page, 'Entra nella dashboard'),
  ]);

  await page.waitForFunction(() => window.location.pathname.startsWith('/app'), { timeout: 30000 });
  log('AUTH', `Login ok su ${await page.evaluate(() => window.location.pathname)}`);
}

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error') {
        console.error(`[BROWSER:${type}] ${msg.text()}`);
      }
    });

    await login(page);

    log('TEST', 'Verifico compilazione campo in Impostazioni > Identita`');
    await page.goto(`${BASE_URL}/dashboard/impostazioni`, { waitUntil: 'networkidle2' });
    const nameSelector = await markFieldByLabel(page, 'Nome testata');
    await focusField(page, nameSelector);
    const filledName = 'Val Brembana Web QA CMS';
    const fillResponse = await sendPrompt(page, `imposta ${filledName}`);
    const currentName = await getFieldValue(page, nameSelector);

    if (currentName !== filledName) {
      throw new Error(`Compilazione Nome testata fallita. Valore attuale: ${currentName}. Risposta IA: ${fillResponse}`);
    }
    log('PASS', `Campo Nome testata compilato: ${currentName}`);

    log('TEST', 'Con campo selezionato faccio una domanda generica sul CMS');
    await focusField(page, nameSelector);
    const beforeGeneric = await getFieldValue(page, nameSelector);
    const genericResponse = await sendPrompt(page, 'Su questa pagina cosa devo controllare per SEO e analytics prima di pubblicare?');
    const afterGeneric = await getFieldValue(page, nameSelector);

    if (afterGeneric !== beforeGeneric) {
      throw new Error(`La domanda generica ha sovrascritto il campo. Prima: ${beforeGeneric} Dopo: ${afterGeneric}`);
    }

    if (!/seo|analytics|descrizione|google|tracking|dominio|publish|meta/i.test(genericResponse)) {
      throw new Error(`La risposta generica non sembra contestuale al CMS: ${genericResponse}`);
    }
    log('PASS', `Domanda generica ok: ${genericResponse.slice(0, 140)}...`);

    log('TEST', 'Verifico compilazione campo in tab SEO & Analytics');
    await clickByText(page, 'SEO & Analytics', 'button');
    const gaSelector = await markFieldByLabel(page, 'Google Analytics ID');
    await focusField(page, gaSelector);
    const analyticsId = 'G-TEST123456';
    const gaResponse = await sendPrompt(page, `imposta ${analyticsId}`);
    const currentGa = await getFieldValue(page, gaSelector);

    if (currentGa !== analyticsId) {
      throw new Error(`Compilazione Google Analytics ID fallita. Valore attuale: ${currentGa}. Risposta IA: ${gaResponse}`);
    }
    log('PASS', `Campo Google Analytics ID compilato: ${currentGa}`);

    log('TEST', 'Verifico risposta tecnica su pagina Tecnico');
    await page.goto(`${BASE_URL}/dashboard/tecnico`, { waitUntil: 'networkidle2' });
    const technicalResponse = await sendPrompt(page, 'Se il publish si blocca per questo tenant, cosa devo verificare per primo?');
    if (!/publish|job|release|cron|log|tenant|storage|dominio|errore/i.test(technicalResponse)) {
      throw new Error(`Risposta tecnica poco pertinente: ${technicalResponse}`);
    }
    log('PASS', `Risposta tecnica ok: ${technicalResponse.slice(0, 160)}...`);

    log('DONE', 'Smoke test IA CMS online completato con successo');
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(`[FAIL] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
