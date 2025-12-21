#!/usr/bin/env node
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';

const DEFAULT_URL = process.env.LHCI_URL || 'http://localhost:4000/';
const args = process.argv.slice(2);
const urlArgIndex = args.findIndex(arg => arg === '--url');
const targetUrl = urlArgIndex >= 0 && args[urlArgIndex + 1] ? args[urlArgIndex + 1] : DEFAULT_URL;

const thresholds = {
  mobile: {
    lcp: 2500
  },
  desktop: {
    cls: 0.1
  }
};

async function runLighthouse(url, formFactor){
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
  try {
    const options = {
      port: chrome.port,
      logLevel: 'error',
      output: 'json'
    };

    const config = {
      extends: 'lighthouse:default',
      settings: {
        onlyCategories: ['performance'],
        emulatedFormFactor: formFactor,
        formFactor,
        throttlingMethod: 'simulate'
      }
    };

    if (formFactor === 'desktop') {
      config.settings.screenEmulation = { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false };
      config.settings.throttling = {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      };
    }

    const runnerResult = await lighthouse(url, options, config);
    return runnerResult.lhr;
  } finally {
    await chrome.kill();
  }
}

function formatMs(value){
  return `${(value / 1000).toFixed(2)} s`;
}

(async () => {
  const results = {};
  let hasError = false;

  for (const formFactor of ['mobile', 'desktop']){
    try{
      const lhr = await runLighthouse(targetUrl, formFactor);
      results[formFactor] = lhr;

      const audits = lhr.audits;
      if (formFactor === 'mobile'){
        const lcp = audits['largest-contentful-paint'].numericValue;
        const tbt = audits['total-blocking-time']?.numericValue ?? 0;
        console.log(`Mobile LCP: ${formatMs(lcp)}, TBT: ${Math.round(tbt)} ms, Performance: ${Math.round(lhr.categories.performance.score * 100)}`);
        if (lcp > thresholds.mobile.lcp){
          console.error(`✖ Mobile LCP exceeded threshold (${formatMs(lcp)} > ${(thresholds.mobile.lcp/1000).toFixed(2)} s)`);
          hasError = true;
        }
      } else {
        const cls = audits['cumulative-layout-shift'].numericValue;
        console.log(`Desktop CLS: ${cls.toFixed(3)}, Performance: ${Math.round(lhr.categories.performance.score * 100)}`);
        if (cls > thresholds.desktop.cls){
          console.error(`✖ Desktop CLS exceeded threshold (${cls.toFixed(3)} > ${thresholds.desktop.cls})`);
          hasError = true;
        }
      }

      const lcpDetails = audits['largest-contentful-paint-element']?.details?.items?.[0]?.node;
      if (lcpDetails){
        console.log(`LCP element (${formFactor}): ${lcpDetails.snippet?.trim() || 'unknown'} -> ${lcpDetails.url || lcpDetails.selector || 'n/a'}`);
      }
    } catch (err){
      console.error(`Failed to run Lighthouse for ${formFactor}:`, err);
      hasError = true;
    }
  }

  if (hasError){
    process.exitCode = 1;
  }
})();
