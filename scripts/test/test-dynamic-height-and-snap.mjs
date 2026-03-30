#!/usr/bin/env node
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

async function runTest() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    console.log('📋 Testing Dynamic Page Height and Snap-to-Document-Edges...\n');

    // Test 1: Login
    console.log('1️⃣ Logging in...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });

    // Try test credentials (adjust if different)
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'password123');

    // Try to submit, expect it might fail but we just need to get to a protected page
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      try {
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 3000 }).catch(() => {});
      } catch (e) {
        console.log('   ⚠️  Login attempt (may fail with test creds, but continuing...)');
      }
    }

    // Navigate directly to editor
    console.log('2️⃣ Navigating to editor...');
    await page.goto(`${BASE_URL}/dashboard/editor`, { waitUntil: 'networkidle2', timeout: 10000 }).catch(async () => {
      // If we can't get to editor, take screenshot for debugging
      const screenshotPath = path.join(process.cwd(), 'test-editor-fail.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`   Screenshot saved: ${screenshotPath}`);
      throw new Error('Could not reach editor page');
    });

    // Test 2: Check Canvas and page metrics
    console.log('3️⃣ Checking canvas and page height...');

    const pageHeight = await page.evaluate(() => {
      const pageSurface = document.querySelector('[data-page-surface="true"]');
      const pageFrame = document.querySelector('.sb-page-frame');

      if (!pageSurface || !pageFrame) {
        return { error: 'Page surface or frame not found' };
      }

      return {
        pageSurfaceScrollHeight: pageSurface.scrollHeight,
        pageSurfaceMinHeight: window.getComputedStyle(pageSurface).minHeight,
        pageFrameHeight: window.getComputedStyle(pageFrame).minHeight,
        pageFrameZoom: window.getComputedStyle(pageFrame).zoom,
      };
    });

    console.log('   Page Metrics:', pageHeight);

    if (pageHeight.error) {
      console.log('   ❌ ERROR:', pageHeight.error);
    } else {
      console.log(`   ✅ Page surface scroll height: ${pageHeight.pageSurfaceScrollHeight}px`);
      console.log(`   ✅ Page surface min-height: ${pageHeight.pageSurfaceMinHeight}`);
      console.log(`   ✅ Page frame min-height: ${pageHeight.pageFrameHeight}`);
    }

    // Test 3: Check snap-to-document-edges toggle button
    console.log('\n4️⃣ Checking snap-to-document-edges toggle...');

    const snapState = await page.evaluate(() => {
      const bordoButton = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent.includes('Bordi')
      );

      if (!bordoButton) {
        return { error: 'Snap to document edges button not found' };
      }

      const isActive = bordoButton.style.background !== '' || bordoButton.classList.contains('active');
      return {
        buttonFound: true,
        buttonText: bordoButton.textContent.trim(),
        isActive: isActive,
        title: bordoButton.title,
      };
    });

    console.log('   Snap Button State:', snapState);

    if (snapState.error) {
      console.log('   ⚠️ WARNING:', snapState.error);
    } else {
      console.log(`   ✅ Button found: "${snapState.buttonText}"`);
      console.log(`   ✅ Active state: ${snapState.isActive ? 'ACTIVE' : 'INACTIVE'}`);
      console.log(`   ✅ Title: ${snapState.title}`);
    }

    // Test 4: Add a test block and check if page height expands
    console.log('\n5️⃣ Testing page height expansion when adding content...');

    const beforeAddHeight = await page.evaluate(() => {
      const pageFrame = document.querySelector('.sb-page-frame');
      return window.getComputedStyle(pageFrame).minHeight;
    });

    // Try to add a text block by finding and clicking the + button or using keyboard
    const addBlockButton = await page.$('[title*="Add"], button:has-text("Aggiungi")');

    if (addBlockButton) {
      try {
        await addBlockButton.click();
        await page.waitForTimeout(500);
      } catch (e) {
        console.log('   ⚠️ Could not click add button, trying keyboard...');
      }
    }

    const afterAddHeight = await page.evaluate(() => {
      const pageFrame = document.querySelector('.sb-page-frame');
      return window.getComputedStyle(pageFrame).minHeight;
    });

    console.log(`   Before adding content: ${beforeAddHeight}`);
    console.log(`   After trying to add: ${afterAddHeight}`);

    // Take final screenshot
    const screenshotPath = path.join(process.cwd(), 'test-canvas-state.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`\n✅ Test complete! Screenshot saved: ${screenshotPath}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

runTest();
