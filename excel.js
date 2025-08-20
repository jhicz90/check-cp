import dayjs from 'dayjs';
import ExcelJS from 'exceljs'

/**
 * Reads an Excel file and returns the worksheet data
 * @param {string} filePath - Path to the Excel file
 * @param {string} sheetName - Name of the worksheet to read (optional)
 * @returns {Promise<Array>} Array containing the worksheet data
 */
export async function readExcelFile(filePath, sheetName = null) {
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        // Get the specified worksheet or the first one
        const worksheet = sheetName
            ? workbook.getWorksheet(sheetName)
            : workbook.worksheets[0];

        if (!worksheet) {
            throw new Error('Worksheet not found');
        }

        const data = [];

        // Read all rows including header row
        worksheet.eachRow((row, rowNumber) => {
            const rowValues = row.values.slice(1); // Remove the first undefined element

            // Process each cell to handle dates properly
            const processedValues = rowValues.map((value, index) => {
                // If the value is a Date object, preserve it as is

                if (index === 6) {

                    // Evitamos conversión automática de zona horaria
                    const fecha = new Date(value);

                    // Obtenemos día, mes y año en UTC
                    const dia = String(fecha.getUTCDate()).padStart(2, '0');
                    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0'); // meses inician en 0
                    const anio = fecha.getUTCFullYear();

                    const fechaFormateada = `${dia}/${mes}/${anio}`;

                    return fechaFormateada
                }
                return value;
            });

            data.push(processedValues);
        });

        return data;
    } catch (error) {
        console.error('Error reading Excel file:', error);
        throw error;
    }
}