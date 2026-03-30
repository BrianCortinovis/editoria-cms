#!/usr/bin/env node

import puppeteer from 'puppeteer';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function testInputEditing() {
  console.log(`🧪 Testing input editing in RightPanel at ${BASE_URL}`);

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to app
    console.log('📍 Navigating to login page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
      console.log('⚠️ Login page not available, trying homepage...');
    });

    // Try to detect if we're logged in
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check for any editor pages
    console.log('🔍 Checking for editor availability...');

    // Take a screenshot to debug
    await page.screenshot({ path: '/tmp/editor-test-1.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/editor-test-1.png');

    // Try to find a button or link that goes to editor
    const editLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      return links
        .filter(el => el.textContent.toLowerCase().includes('editor') || el.textContent.toLowerCase().includes('modifica'))
        .map(el => ({
          text: el.textContent.slice(0, 50),
          href: el.getAttribute('href'),
          tag: el.tagName
        }));
    });

    if (editLinks.length > 0) {
      console.log('✓ Found editor links:', editLinks);
    } else {
      console.log('⚠️ No editor links found. You may need to manually navigate.');
      console.log('📌 Please:');
      console.log('   1. Open browser at http://localhost:3000');
      console.log('   2. Login with your credentials');
      console.log('   3. Open any page in the editor');
      console.log('   4. Select a block with inner elements (Hero, Carousel, etc)');
      console.log('   5. Go to RightPanel → Props tab');
      console.log('   6. Click on "CTA testo" field and try to type');
      console.log('   7. Check if text appears or if it\'s stuck');
    }

    // Keep browser open for manual testing
    console.log('\n⏳ Keeping browser open for 30 seconds... You can test manually.');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testInputEditing().catch(console.error);
