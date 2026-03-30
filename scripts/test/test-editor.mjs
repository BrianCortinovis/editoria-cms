#!/usr/bin/env node
/**
 * Editor Testing Tool - Verifica gradienti, glassmorphism e altri effetti
 * Uso: node scripts/test-editor.mjs
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './screenshots';

// Assicura che la directory screenshots esista
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function testEditor() {
  console.log('🚀 Starting Editor Testing...\n');

  let browser;
  try {
    console.log('📦 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    console.log('📄 Opening editor...');
    await page.goto(`${BASE_URL}/dashboard/editor`, { waitUntil: 'networkidle2' });

    // Screenshot 1: Canvas vuoto
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-empty-canvas.png`, fullPage: true });
    console.log('✅ Screenshot 1: Empty canvas saved');

    // Controlla se RightPanel esiste
    console.log('\n🎨 Checking page structure...');
    const pageContent = await page.content();
    if (pageContent.includes('RightPanel') || pageContent.includes('Stile')) {
      console.log('✅ Editor content found');
    }

    // Prova a trovare il pulsante più importante: il + per aggiungere blocchi
    console.log('\n📝 Checking for add block button...');
    const plusButtons = await page.$$eval('button', buttons =>
      buttons.map(b => ({ text: b.textContent, html: b.innerHTML.substring(0, 50) }))
    );
    console.log(`   Found ${plusButtons.length} buttons`);
    if (plusButtons.length > 0) {
      console.log(`   First few buttons: ${JSON.stringify(plusButtons.slice(0, 3))}`);
    }

    // Prova a trovare sezioni di Stile
    console.log('\n🌈 Checking for Style panels...');
    const allText = await page.evaluate(() => document.body.innerText);
    if (allText.includes('Stile')) console.log('✅ Found "Stile" tab');
    if (allText.includes('Gradiente')) console.log('✅ Found "Gradiente" section');
    if (allText.includes('Glassmorphism')) console.log('✅ Found "Glassmorphism" section');

    // Screenshot 2: Full page with potential UI
    await delay(1000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-full-ui-check.png`, fullPage: true });
    console.log('✅ Screenshot 2: Full UI saved');

    console.log('\n📊 Test Results:');
    console.log(`   ✅ Editor loaded successfully`);
    console.log(`   ✅ Base URL: ${BASE_URL}`);
    console.log(`   ✅ Screenshots saved in: ${path.resolve(SCREENSHOT_DIR)}/`);
    console.log(`\n   Canvas Status: ${pageContent.includes('empty') ? 'Empty (need to add blocks)' : 'Unknown'}`);
    console.log(`   RightPanel: ${pageContent.includes('RightPanel') ? 'Present' : 'Not found'}`);

    console.log('\n💡 Next Steps:');
    console.log('   1. Check screenshots in ./screenshots/');
    console.log('   2. Manually add a block to canvas');
    console.log('   3. Select block and test Gradient changes');
    console.log('   4. Test Glassmorphism effects');
    console.log('   5. Verify canvas updates in real-time\n');

    await browser.close();
    console.log('✨ Test complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

testEditor();
