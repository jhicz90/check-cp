import puppeteer from 'puppeteer';

const userAgentStrings = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
];

export async function checkInvoiceSunat(invoiceData) {
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless: 'shell',
      // defaultViewport: null,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      userAgent: userAgentStrings[Math.floor(Math.random() * userAgentStrings.length)]
    });

    // Create new page
    const page = await browser.newPage();

    // Go to SUNAT verification page
    await page.goto('https://ww1.sunat.gob.pe/ol-ti-itconsultaunificadalibre/consultaUnificadaLibre/consulta');

    // Wait for form elements to load
    await page.waitForSelector('#numRuc');

    // Fill the form with invoice data
    await page.type('#numRuc', invoiceData.ruc);
    if (invoiceData.type === '02') {
      await page.select('#codComp', 'R1');
    } else {
      await page.select('#codComp', invoiceData.type);
    }
    await page.type('#numeroSerie', invoiceData.serie);
    await page.type('#numero', invoiceData.number);
    await page.type('#fechaEmision', invoiceData.date);
    if (invoiceData.type !== '03') {
      await page.select('#codDocRecep', "6");
      await page.type('#numDocRecep', "20167712283");
      await page.type('#monto', invoiceData.amount);
    }

    // Click verify button
    await page.click('#btnConsultar');

    // Get verification result

    // Wait 5 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 5000));

    const resultText = await page.$eval('#resEstado', el => el.textContent);

    if (resultText === 'aaa') {
      throw new Error('Invoice not found');
    } else {
      const nameScrrenshot = `invoice-verification-${invoiceData.ruc}-${invoiceData.type}-${invoiceData.serie}-${invoiceData.number}.png`;

      await page.screenshot({
        path: nameScrrenshot,
        fullPage: true
      });

      return {
        success: true,
        message: resultText,
        screenshot: nameScrrenshot
      };
    }
  } catch (error) {
    console.error('❌ Error during verification:', error);
    return {
      success: false,
      message: error.message
    };
  }
}