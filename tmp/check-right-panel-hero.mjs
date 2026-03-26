import puppeteer from 'puppeteer';

const BASE_URL = 'http://127.0.0.1:3000';
const EMAIL = 'editor.test@valbrembana.local';
const PASSWORD = 'editor2026!';
const PAGE_ID = '3838e98c-c1d3-4091-9547-5b001dc6d948';
const HERO_BLOCK_ID = 'B01Wf14epoMA';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fieldByLabel(page, labelText) {
  return await page.evaluate((label) => {
    const labels = Array.from(document.querySelectorAll('label'));
    const match = labels.find((node) => node.textContent?.trim() === label);
    const fieldId = match?.getAttribute('for');
    const field = fieldId ? document.getElementById(fieldId) : null;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) {
      return null;
    }
    return { id: field.id, value: field.value };
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
  await wait(1500);

  await page.click(`#editor-block-${HERO_BLOCK_ID}`);
  await wait(600);

  const labels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('label'))
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .slice(0, 40)
  );

  const before = {
    title: await fieldByLabel(page, 'Titolo'),
    ctaText: await fieldByLabel(page, 'CTA testo'),
    ctaUrl: await fieldByLabel(page, 'CTA URL'),
  };

  console.log('labels', labels);
  console.log('before', before);

  if (!before.ctaText?.id) {
    throw new Error('CTA testo non trovato');
  }

  await page.click(`#${before.ctaText.id}`, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.keyboard.type('CTA CHECK OK');
  await wait(400);

  const after = {
    ctaText: await fieldByLabel(page, 'CTA testo'),
    heroText: await page.$eval(`#editor-block-${HERO_BLOCK_ID}`, (node) => node.textContent || ''),
  };

  console.log('after', after);
} catch (error) {
  console.error('FAIL', error);
  console.log(
    'BODY',
    await page.evaluate(() => document.body.innerText.slice(0, 2500)).catch(() => 'body unavailable')
  );
} finally {
  await browser.close();
}
