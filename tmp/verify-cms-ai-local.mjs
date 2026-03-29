#!/usr/bin/env node

import puppeteer from "puppeteer";

const BASE_URL = "http://127.0.0.1:3000";
const EMAIL = "briancortinovis@gmail.com";
const PASSWORD = "12345678";
const TENANT_ID = "125172d3-f498-439f-a045-61e409dac706";

function log(label, value) {
  console.log(`\n[${label}]`);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
}

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }),
    page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find((node) =>
        node.textContent?.includes("Entra nella dashboard"),
      );
      if (!(button instanceof HTMLElement)) {
        throw new Error("Pulsante login non trovato");
      }
      button.click();
    }),
  ]);
}

async function openAiWidget(page) {
  await page.evaluate(() => {
    const widgets = [...document.querySelectorAll("div.fixed.bottom-4.right-4")];
    const widget = widgets.find((node) => node.textContent?.includes("AI Assistant"));
    const trigger = widget?.querySelector("div.cursor-pointer");
    if (!(trigger instanceof HTMLElement)) {
      throw new Error("Widget AI non trovato");
    }
    trigger.click();
  });

  await page.waitForSelector('input[placeholder="Scrivi un prompt..."]', {
    timeout: 15000,
  });
}

async function sendUiPrompt(page, prompt) {
  await page.click('input[placeholder="Scrivi un prompt..."]', { clickCount: 3 });
  await page.keyboard.press("Backspace");
  await page.type('input[placeholder="Scrivi un prompt..."]', prompt, { delay: 8 });

  const aiResponsePromise = page
    .waitForResponse(
      (response) =>
        response.url().includes("/api/ai/dispatch") &&
        response.request().method() === "POST",
      { timeout: 8000 },
    )
    .then(async (response) => ({
      status: response.status(),
      payload: await response.json(),
    }))
    .catch(() => null);

  await page.click('form button[type="submit"]');
  const apiResult = await aiResponsePromise;

  await page.waitForFunction(
    () => !document.body.innerText.includes("Sta pensando..."),
    { timeout: 90000 },
  );

  const bubbles = await page.evaluate(() =>
    [...document.querySelectorAll("div.max-w-xs")]
      .map((node) => node.textContent?.trim() || "")
      .filter(Boolean),
  );

  return {
    status: apiResult?.status ?? null,
    payload: apiResult?.payload ?? null,
    lastBubble: bubbles.at(-1) || "",
    bubbles,
  };
}

async function runAuthenticatedDispatch(page, body) {
  return page.evaluate(async (payload) => {
    const start = Date.now();
    const response = await fetch("/api/ai/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await response.json();
    return {
      status: response.status,
      elapsedMs: Date.now() - start,
      json,
    };
  }, body);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);
    await login(page);

    await page.goto(`${BASE_URL}/dashboard/impostazioni`, { waitUntil: "networkidle2" });
    await page.evaluate(() => {
      const label = [...document.querySelectorAll("label")].find((node) =>
        node.textContent?.includes("Nome testata"),
      );
      const field = label?.parentElement?.querySelector("input,textarea,select");
      if (!(field instanceof HTMLElement)) {
        throw new Error('Campo "Nome testata" non trovato');
      }
      field.setAttribute("data-cms-ai-test-field", "testata");
      field.click();
    });

    await openAiWidget(page);
    const uiFill = await sendUiPrompt(page, "imposta Val Brembana Web QA CMS");
    const fieldValue = await page.$eval(
      '[data-cms-ai-test-field="testata"]',
      (node) => node.value,
    );

    log("UI_FIELD_FILL", {
      fieldValue,
      responseStatus: uiFill.status,
      lastBubble: uiFill.lastBubble,
    });

    const pageQuestion = await runAuthenticatedDispatch(page, {
      tenant_id: TENANT_ID,
      taskType: "chatbot",
      prompt:
        'Pagina aperta: Impostazioni sito. Rispondi in italiano in massimo 6 punti: cosa devo controllare per SEO e analytics prima di pubblicare?',
      systemPrompt:
        "Sei un assistente del CMS online specializzato solo nel CMS. Rispondi in italiano, sintetico, pratico, senza parlare dell'editor desktop.",
    });
    log("PAGE_CONTEXT_QA", pageQuestion);

    const crossAreaQuestion = await runAuthenticatedDispatch(page, {
      tenant_id: TENANT_ID,
      taskType: "chatbot",
      prompt:
        "Anche se sono nella pagina impostazioni, spiegami cosa devo controllare nel modulo Media del CMS prima di pubblicare una gallery.",
      systemPrompt:
        "Sei un assistente del CMS online specializzato solo nel CMS. Rispondi in italiano, sintetico, pratico, senza parlare dell'editor desktop.",
    });
    log("CROSS_AREA_QA", crossAreaQuestion);

    const fallbackQuestion = await runAuthenticatedDispatch(page, {
      tenant_id: TENANT_ID,
      taskType: "chatbot",
      prompt: "Rispondi con una frase breve: controllo CMS ok.",
      systemPrompt:
        "Sei un assistente del CMS online. Rispondi solo con una frase breve in italiano.",
      preferredProvider: "openai",
    });
    log("FALLBACK_QA", fallbackQuestion);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
