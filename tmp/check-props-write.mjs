import puppeteer from 'puppeteer';

const BASE_URL = 'http://127.0.0.1:3000';
const EMAIL = 'editor.test@valbrembana.local';
const PASSWORD = 'editor2026!';
const PAGE_ID = '3838e98c-c1d3-4091-9547-5b001dc6d948';
const HERO_ID = 'B01Wf14epoMA';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getFieldMeta(page, labelText) {
  return await page.evaluate((label) => {
    const labels = Array.from(document.querySelectorAll('label'));
    const node = labels.find((el) => el.textContent?.trim() === label);
    const id = node?.getAttribute('for');
    const field = id ? document.getElementById(id) : null;
    return {
      id: id || null,
      value: field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? field.value : null,
    };
  }, labelText);
}

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();

try {
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
  const loginInputs = await page.$$('input');
  await loginInputs[0].type(EMAIL);
  await loginInputs[1].type(PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});

  await page.goto(`${BASE_URL}/dashboard/editor?page=${PAGE_ID}`, { waitUntil: 'networkidle2' });
  await sleep(1500);

  await page.waitForSelector(`#editor-block-${HERO_ID}`, { timeout: 15000 });
  await page.click(`#editor-block-${HERO_ID}`);
  await sleep(800);

  const before = {
    selectedIds: await page.evaluate(() => Array.from(document.querySelectorAll('.sb-selected')).map((el) => el.getAttribute('data-block-id'))),
    labels: await page.evaluate(() => Array.from(document.querySelectorAll('label')).map((el) => el.textContent?.trim()).filter(Boolean).slice(0, 30)),
    ctaText: await getFieldMeta(page, 'CTA testo'),
    ctaUrl: await getFieldMeta(page, 'CTA URL'),
  };

  console.log('before', JSON.stringify(before, null, 2));

  if (!before.ctaText.id || !before.ctaUrl.id) {
    throw new Error('Campi CTA non trovati nel pannello destro');
  }

  await page.click(`#${before.ctaText.id}`, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('CTA CHECK OK');
  await sleep(250);

  await page.click(`#${before.ctaUrl.id}`, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('/cta-check-ok');
  await sleep(500);

  const after = {
    ctaText: await getFieldMeta(page, 'CTA testo'),
    ctaUrl: await getFieldMeta(page, 'CTA URL'),
    heroDom: await page.$eval(`#editor-block-${HERO_ID}`, (node) => node.textContent || ''),
  };

  console.log('after', JSON.stringify(after, null, 2));
} catch (error) {
  console.error('FAIL', error);
  console.log(
    'BODY',
    await page.evaluate(() => document.body.innerText.slice(0, 2500)).catch(() => 'body unavailable')
  );
} finally {
  await browser.close();
}
