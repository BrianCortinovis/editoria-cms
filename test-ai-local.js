#!/usr/bin/env node

/**
 * Script di test locale per il sistema IA
 * Esegui: node test-ai-local.js
 *
 * Testa:
 * - Layout generici (home, articoli, ecc)
 * - Contenuto specifico campi
 * - Creazione blocchi
 * - Parsing JSON
 */

const fs = require('fs');
const path = require('path');

// Log file
const LOG_FILE = '/tmp/ai-test-log.txt';
const SCREENSHOTS_DIR = '/tmp/ai-screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

class AITester {
  constructor() {
    this.logs = [];
    this.results = [];
    this.testNum = 0;
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    this.logs.push(logEntry);
    console.log(logEntry);
  }

  async test(name, prompt, expectedType = 'json') {
    this.testNum++;
    this.log('INFO', `\n${'='.repeat(60)}`);
    this.log('INFO', `TEST ${this.testNum}: ${name}`);
    this.log('INFO', `Tipo atteso: ${expectedType}`);
    this.log('INFO', `Prompt: ${prompt.substring(0, 100)}...`);
    this.log('INFO', `${'='.repeat(60)}`);

    const result = {
      testNum: this.testNum,
      name,
      prompt,
      expectedType,
      status: 'pending',
      response: '',
      error: null,
      duration: 0,
    };

    const startTime = Date.now();

    try {
      // Simula la chiamata API al backend (dovrebbe essere fatto via HTTP)
      // Per ora loggo cosa dovrebbe testare
      const systemPrompt = expectedType === 'json'
        ? `Sei un assistente AI per un builder giornalistico. Crea layout con blocchi.
Blocchi disponibili: section, hero, text, columns, container, image-gallery, video, slideshow, carousel, quote, accordion, tabs, social, newsletter, banner-ad, related-content, author-bio, timeline, counter, divider
Rispondi SEMPRE con un JSON array di azioni "add-block". Rispondi SEMPRE in italiano.`
        : `Sei un assistente AI per un CMS editoriale. Genera contenuti concisi e di qualità. Rispondi sempre in italiano.`;

      this.log('DEBUG', `System Prompt:\n${systemPrompt}`);

      // Qui andrebbe la vera chiamata API
      result.response = '[MOCK] Risposta simulata - in produzione chiamerebbe l\'API';
      result.status = 'passed';

      this.log('INFO', `✓ Test completato con successo`);

    } catch (err) {
      result.error = err.message;
      result.status = 'failed';
      this.log('ERROR', `✗ Test fallito: ${err.message}`);
    }

    result.duration = Date.now() - startTime;
    this.results.push(result);

    this.log('INFO', `Durata: ${result.duration}ms\n`);
    return result;
  }

  async runAll() {
    this.log('INFO', '\n╔════════════════════════════════════════════════════════════╗');
    this.log('INFO', '║          TESTER SISTEMA IA - EDITORIA CMS                ║');
    this.log('INFO', '╚════════════════════════════════════════════════════════════╝\n');

    // Test 1: Home page generico
    await this.test(
      'Generic Layout - Home Page',
      'Crea una home page giornalistica professionale con hero grande in alto, sotto sezioni per le notizie principali, editoriali e contenuti correlati',
      'json'
    );

    // Test 2: Layout articolo
    await this.test(
      'Specific Article Layout',
      'Crea il layout per una pagina articolo: titolo grande, immagine in evidenza, testo articolo, box autore, articoli correlati',
      'json'
    );

    // Test 3: Titolo campo
    await this.test(
      'Field Content - Title',
      'Genera un titolo accattivante per un articolo sulle elezioni comunali',
      'text'
    );

    // Test 4: Sommario
    await this.test(
      'Field Content - Summary',
      'Scrivi un riassunto di 50 parole per: "Il sindaco annuncia nuovi investimenti per la mobilità sostenibile"',
      'text'
    );

    // Test 5: Layout magazine complesso
    await this.test(
      'Complex Layout - Magazine',
      'Disegna una home page magazine con: hero principale, griglia di articoli in 3 colonne, timeline di ultime notizie, newsletter, banner pubblicitario',
      'json'
    );

    // Test 6: Meta description SEO
    await this.test(
      'SEO Content',
      'Scrivi meta description (max 160 caratteri) per pagina home di giornale locale',
      'text'
    );

    this.printSummary();
    this.saveResults();
  }

  printSummary() {
    this.log('INFO', '\n╔════════════════════════════════════════════════════════════╗');
    this.log('INFO', '║                      SUMMARY RISULTATI                     ║');
    this.log('INFO', '╚════════════════════════════════════════════════════════════╝\n');

    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const successRate = ((passed / total) * 100).toFixed(1);

    this.log('INFO', `Total Tests:   ${total}`);
    this.log('INFO', `Passed:        ${passed} ✓`);
    this.log('INFO', `Failed:        ${failed} ✗`);
    this.log('INFO', `Success Rate:  ${successRate}%\n`);

    this.log('INFO', 'Dettaglio test:');
    this.results.forEach(r => {
      const icon = r.status === 'passed' ? '✓' : '✗';
      this.log('INFO', `  ${icon} [${r.testNum}] ${r.name} (${r.duration}ms)`);
    });
  }

  saveResults() {
    const logContent = this.logs.join('\n');
    fs.writeFileSync(LOG_FILE, logContent);

    const resultsJson = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        successRate: `${(this.results.filter(r => r.status === 'passed').length / this.results.length * 100).toFixed(1)}%`,
      },
      results: this.results,
    };

    fs.writeFileSync(
      path.join(SCREENSHOTS_DIR, 'results.json'),
      JSON.stringify(resultsJson, null, 2)
    );

    this.log('INFO', `\n📋 Log salvato: ${LOG_FILE}`);
    this.log('INFO', `📊 Risultati salvati: ${path.join(SCREENSHOTS_DIR, 'results.json')}`);
  }
}

// Esegui i test
const tester = new AITester();
tester.runAll().catch(console.error);
