import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle2' });
const result = await page.evaluate(() => ({
  title: document.title,
  bodyText: document.body.innerText.slice(0, 200),
  heroCards: document.querySelectorAll('#vbw-side-left .vbw-side-card, #vbw-side-right .vbw-side-card').length,
  sections: document.querySelectorAll('#vbw-home-sections .vbw-section').length,
}));
console.log(JSON.stringify(result, null, 2));
await browser.close();
