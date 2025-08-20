import { chromium } from 'playwright';
import dayjs from 'dayjs';

const userAgentStrings = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
];

export async function checkInvoiceSunat(invoiceData) {
  try {
    // Launch browser
    const browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      userAgent: userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)]
    });

    // Create new context and page
    const context = await browser.newContext();
    const page = await context.newPage();

    // Go to SUNAT verification page
    await page.goto('https://ww1.sunat.gob.pe/ol-ti-itconsultaunificadalibre/consultaUnificadaLibre/consulta');

    // Wait for form elements to load
    await page.waitForSelector('#numRuc');

    // Fill the form with invoice data
    await page.fill('#numRuc', invoiceData.ruc);
    await page.fill('#codComp', invoiceData.type);
    await page.fill('#numeroSerie', invoiceData.serie);
    await page.fill('#numero', invoiceData.number);
    await page.fill('#codDocRecep', "6");
    await page.fill('#numDocRecep', "20167712283");
    await page.fill('#fechaEmision', dayjs(invoiceData.date).format('YYYY-MM-DD'));
    await page.fill('#monto', invoiceData.amount);

    // Click verify button
    await page.click('#btnConsultar');

    // Wait for results
    await page.waitForSelector('.ui-dialog-content', { timeout: 5000 });

    // Take screenshot
    await page.screenshot({
      path: `invoice-verification-${Date.now()}.png`,
      fullPage: true
    });

    // Get verification result
    const resultText = await page.locator('.ui-dialog-content').textContent();

    // Close browser
    await context.close();
    await browser.close();

    return {
      success: true,
      message: resultText,
      screenshot: `invoice-verification-${Date.now()}.png`
    };

  } catch (error) {
    console.error('Error during verification:', error);
    return {
      success: false,
      message: error.message
    };
  }
}