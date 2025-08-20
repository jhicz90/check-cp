import dayjs from 'dayjs';
// Read and process Excel file data
import { checkInvoiceSunat } from './checkCPSunatV1.js';
import { readExcelFile } from './excel.js';

const delay = (ms) => {
  return new Promise(res => setTimeout(res, ms * 1000));
}

const excelData = await readExcelFile('./CAJA CHICA-Abril 2025.xlsx');

if (!excelData || !excelData.length) {
  console.error('❌ No data found in Excel file');
  process.exit(1);
}

// Store the Excel data for further processing
const records = excelData.filter((d, i) => (i >= 3 && d['6'])).map(row => {
  return {
    fecha: row['6'],
    ruc: row['7'],
    tipo: row['8'],
    serie: row['9'],
    numero: row['10'],
    importe: row['15'],
  };
});

console.log(`✅ Successfully loaded ${records.length} records from Excel file`);

// Filter CP records
const cpSunatRecords = records.filter(record => Number(record.tipo) === 1 || Number(record.tipo) === 2 || Number(record.tipo) === 3);

console.log(`✅ Successfully loaded ${cpSunatRecords.length} CP records from Excel file`);
console.log(`------------------------------`);

// Check each CP record with SUNAT
for (const record of cpSunatRecords) {
  
  console.log(`🗒️ CP: ${record.serie}-${record.numero}`)

  let attempts = 0;
  let result;
  
  do {
    attempts++;
    try {
      result = await checkInvoiceSunat({
        ruc: record.ruc,
        type: String(`0${record.tipo}`),
        serie: record.serie,
        number: String(record.numero),
        date: dayjs(record.fecha).format('dd/MM/YYYY'),
        amount: String(record.importe)
      });
      
      // Registrar la fecha que se está enviando para verificación
      console.log(`📅 Fecha enviada a SUNAT: ${dayjs(record.fecha).format('DD/MM/YYYY')}`);

      if (result.success) break;
    } catch (error) {
      console.log(`Attempt ${attempts} failed. Retrying...`);
      if (attempts === 5) throw error;
      await delay(5); // Wait 5 seconds before retrying
    }
  } while (attempts < 5);

  console.log(`✅ ${result.message}`);

  if (result.success) {
    console.log(`✅ Invoice verified successfully: ${record.serie}-${record.numero}`);
  } else {
    console.log(`❌ Invoice verification failed: ${record.serie}-${record.numero}`);
  }

  if (result.screenshot) {
    console.log(`✅ Screenshot saved: ${result.screenshot}`);
  } else {
    console.log(`❌ No screenshot saved`);
  }

  console.log(`------------------------------`);
  console.log(`Wait 60 seconds before next request`);
  console.log(`\n`);
  await delay(60);
}

// const record = cpSunatRecords[0];
// const result = await checkInvoiceSunat({
//   ruc: record.ruc,
//   type: String(`0${record.tipo}`),
//   serie: record.serie,
//   number: String(record.numero),
//   date: dayjs(record.fecha).format('DD/MM/YYYY'),
//   amount: String(record.importe)
// });
// console.log(result);

// al terminar finalizar el programa
console.log('Finished processing all records');
process.exit(0);