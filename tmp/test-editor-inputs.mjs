import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({headless:'new'});
const page = await browser.newPage();
page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
try {
  await page.goto('http://127.0.0.1:3000/auth/login', {waitUntil:'networkidle2'});
  const inputs = await page.$$('input');
  await inputs[0].type('giornalista.test@valbrembana.local');
  await inputs[1].type('desk2026!');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({waitUntil:'networkidle2', timeout:15000}).catch(()=>{});
  console.log('after login', page.url());
  await page.goto('http://127.0.0.1:3000/dashboard/editor', {waitUntil:'networkidle2'});
  console.log('editor url', page.url());
  console.log('body', await page.evaluate(()=>document.body.innerText.slice(0,800)));
} catch (e) {
  console.error(e);
} finally {
  await browser.close();
}
