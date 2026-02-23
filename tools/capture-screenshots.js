#!/usr/bin/env node

/**
 * Screenshot Capture Tool for Doop UX Portfolio
 * 
 * Este script captura screenshots estratégicos de los sitios web
 * enfocados en mostrar resultados de negocio, no solo diseño.
 * 
 * Uso:
 *   node capture-screenshots.js [client]
 * 
 * Ejemplos:
 *   node capture-screenshots.js northgate
 *   node capture-screenshots.js all
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuración de screenshots por cliente
const clients = {
  northgate: {
    url: 'https://northgatebuilding.com.au',
    name: 'Northgate Building Group',
    shots: [
      { path: 'portfolio-northgate-hero.jpg', selector: 'body', fullPage: false, viewport: { width: 1440, height: 900 } },
      { path: 'portfolio-northgate-services.jpg', selector: '.services, [class*="service"]', waitFor: 2000 },
      { path: 'portfolio-northgate-contact.jpg', selector: 'form, .contact, [class*="contact"]', waitFor: 1000 }
    ]
  },
  ralph: {
    url: 'https://www.ralphkerlesart.com',
    name: 'Ralph Kerles Art',
    shots: [
      { path: 'portfolio-ralph-hero.jpg', fullPage: false },
      { path: 'portfolio-ralph-artwork.jpg', selector: '.artwork, .gallery, [class*="product"]', waitFor: 2000 },
      { path: 'portfolio-ralph-wall.jpg', selector: '[class*="wall"], [class*="ar"]', waitFor: 2000 }
    ]
  },
  blcf: {
    url: 'https://beyondlimitscf.org.au',
    name: 'Beyond Limits CF',
    shots: [
      { path: 'portfolio-blcf-hero.jpg', fullPage: false },
      { path: 'portfolio-blcf-donate.jpg', selector: '.donate, [class*="donation"], form', waitFor: 1500 },
      { path: 'portfolio-blcf-impact.jpg', selector: '.impact, .stats, [class*="stat"]', waitFor: 1000 }
    ]
  },
  'blcf-grants': {
    url: 'https://grants.beyondlimitscf.org.au',
    name: 'BLCF Grants Portal',
    shots: [
      { path: 'portfolio-blcf-grants-login.jpg', fullPage: false },
      { path: 'portfolio-blcf-grants-form.jpg', selector: 'form, .application', waitFor: 2000 }
    ]
  },
  casaca: {
    url: 'https://products.casacafilms.com',
    name: 'Casaca Films',
    shots: [
      { path: 'portfolio-casaca-products.jpg', fullPage: false },
      { path: 'portfolio-casaca-product-detail.jpg', selector: '.product, [class*="product"]', waitFor: 1500 }
    ]
  },
  fernando: {
    url: 'https://fernandofilippetti.com',
    name: 'Fernando Filippetti',
    shots: [
      { path: 'portfolio-fernando-hero.jpg', fullPage: false },
      { path: 'portfolio-fernando-about.jpg', selector: '.about, [class*="about"]', waitFor: 1000 }
    ]
  },
  liv: {
    url: 'https://livmigration.com.au',
    name: 'LIV Migration',
    shots: [
      { path: 'portfolio-liv-hero.jpg', fullPage: false },
      { path: 'portfolio-liv-assessment.jpg', selector: '.assessment, form, [class*="visa"]', waitFor: 1500 }
    ]
  },
  ramage: {
    url: 'https://ramageservices.com.au',
    name: 'Ramage Services',
    shots: [
      { path: 'portfolio-ramage-services.jpg', fullPage: false },
      { path: 'portfolio-ramage-before-after.jpg', selector: '.gallery, .before-after, [class*="work"]', waitFor: 1500 }
    ]
  },
  electric: {
    url: 'https://electricvibes.au',
    name: 'Electric Vibes',
    shots: [
      { path: 'portfolio-electric-hero.jpg', fullPage: false },
      { path: 'portfolio-electric-products.jpg', selector: '.product-grid, .collection', waitFor: 1500 }
    ]
  },
  lovebite: {
    url: 'http://lovebite.club',
    name: 'Lovebite Club',
    shots: [
      { path: 'portfolio-lovebite-landing.jpg', fullPage: false }
    ]
  }
};

const OUTPUT_DIR = path.join(__dirname, '..', 'assets');

async function captureScreenshot(browser, clientKey, config) {
  console.log(`\n📸 Capturing ${config.name}...`);
  
  const page = await browser.newPage();
  
  for (const shot of config.shots) {
    try {
      // Configurar viewport
      const viewport = shot.viewport || { width: 1440, height: 900 };
      await page.setViewport(viewport);
      
      // Navegar
      console.log(`  → ${shot.path}`);
      await page.goto(config.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Esperar si es necesario
      if (shot.waitFor) {
        await page.waitForTimeout(shot.waitFor);
      }
      
      // Determinar qué capturar
      let element = page;
      if (shot.selector) {
        try {
          await page.waitForSelector(shot.selector, { timeout: 5000 });
          element = await page.$(shot.selector);
        } catch (e) {
          console.log(`    ⚠️  Selector not found, capturing full page`);
        }
      }
      
      // Capturar
      const outputPath = path.join(OUTPUT_DIR, shot.path);
      await element.screenshot({
        path: outputPath,
        fullPage: shot.fullPage || false,
        type: 'jpeg',
        quality: 85
      });
      
      console.log(`    ✅ Saved: ${shot.path}`);
      
    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
    }
  }
  
  await page.close();
}

async function main() {
  const target = process.argv[2] || 'all';
  
  // Verificar si puppeteer está instalado
  try {
    require.resolve('puppeteer');
  } catch (e) {
    console.log('⚠️  Puppeteer no está instalado.');
    console.log('Instálalo con: npm install puppeteer');
    process.exit(1);
  }
  
  // Asegurar que existe el directorio de salida
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    if (target === 'all') {
      console.log('🚀 Capturing all clients...\n');
      for (const [key, config] of Object.entries(clients)) {
        await captureScreenshot(browser, key, config);
      }
    } else if (clients[target]) {
      await captureScreenshot(browser, target, clients[target]);
    } else {
      console.log(`❌ Client "${target}" not found.`);
      console.log('\nAvailable clients:');
      Object.keys(clients).forEach(key => console.log(`  - ${key}`));
      console.log('\nUse "all" to capture every client.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
    console.log('\n✨ Done!');
  }
}

main();
