const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 2048, height: 1400, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle2', timeout: 120000 });
  const data = await page.evaluate(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (el === null) return null;
      const b = el.getBoundingClientRect();
      return { left: b.left, top: b.top, width: b.width, right: b.right, height: b.height };
    };
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      headerInner: rect('.vbw-header-inner'),
      navInner: rect('.vbw-nav-inner'),
      firstNavLink: rect('.vbw-nav-inner a'),
      ticker: rect('.vbw-ticker'),
      tickerInner: rect('.vbw-ticker-inner'),
      tickerLabel: rect('.vbw-ticker-label'),
      tickerTrackWrap: rect('.vbw-ticker-track-wrap'),
      main: rect('.vbw-main'),
      firstSection: rect('.vbw-main .vbw-section'),
      hero: rect('.vbw-grid-hero'),
      leftStack: rect('#vbw-side-left'),
      centerVideo: rect('#vbw-video'),
      rightStack: rect('#vbw-side-right')
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
