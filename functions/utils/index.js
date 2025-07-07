const FormData = require('form-data');
const axios = require('axios');
const XLSX = require('xlsx');

const { storage } = require("../firebase-config");

function formatDateTime(_date = null) {

    const date = _date ? new Date(_date) : new Date();

    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();

    let hour = '' + date.getHours();
    let minute = '' + date.getMinutes();
    let second = '' + date.getSeconds();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    if (hour.length < 2) hour = '0' + hour;
    if (minute.length < 2) minute = '0' + minute;
    if (second.length < 2) second = '0' + second;

    return [day, month, year].join('/') + ' ' + [hour, minute, second].join(':');
}

const fixText = (text) => {
    let newText = text;
    const arrToReplace = [",", "'", '"', '-', '.', '?', '!', ',', ';', ':']
    arrToReplace.forEach(char => {
        newText = newText.replaceAll(char, '')
    })
    return newText;
}

function isDST(date) {
    const year = date.getFullYear();

    // קביעת התאריכים של תחילת וסיום שעון הקיץ
    const lastFridayMarch = new Date(year, 2, 31);
    while (lastFridayMarch.getDay() !== 5) {
        lastFridayMarch.setDate(lastFridayMarch.getDate() - 1);
    }

    const lastSundayOctober = new Date(year, 9, 31);
    while (lastSundayOctober.getDay() !== 0) {
        lastSundayOctober.setDate(lastSundayOctober.getDate() - 1);
    }

    const dstStart = new Date(year, 2, lastFridayMarch.getDate(), 2, 0, 0); // שעון קיץ מתחיל בשעה 02:00
    const dstEnd = new Date(year, 9, lastSundayOctober.getDate(), 2, 0, 0); // שעון קיץ מסתיים בשעה 02:00

    return date >= dstStart && date < dstEnd;
}

async function uploadFileBufferToStorage(buffer, destination) {
    try {
        if (!buffer || !destination) throw new Error("buffer or destination is missing");


        const fileRef = storage.file(destination);

        // Upload the buffer
        await fileRef.save(buffer);

        return {
            success: true
        };

    } catch (error) {
        console.log(error, "uploadFileBufferToStorage");
        return { error, success: false, message: error.message };
    }
}


async function createSTT(fileBuffer) {
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsApiKey) {
        throw new Error("ELEVENLABS_API_KEY is not set");
    }


    const form = new FormData();
    form.append('file', fileBuffer, 'audio.wav');
    form.append('model_id', 'scribe_v1_experimental');

    try {
        const response = await axios.post('https://api.elevenlabs.io/v1/speech-to-text', form, {
            headers: {
                'xi-api-key': elevenLabsApiKey,
                ...form.getHeaders()
            }
        });

        return {
            success: true,
            text: response.data
        };
    } catch (error) {
        console.error('STT Error:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

/**
 * Generic function to parse Excel file response and convert to JSON
 * @param {ArrayBuffer} excelResponse - The Excel file response from API
 * @param {Object} headerMapping - Object mapping Hebrew headers to English field names
 * @param {Function} rowProcessor - Callback function to process each row (optional)
 * @returns {Array} Array of processed JSON objects
 */
const parseExcelToJson = (excelResponse, headerMapping, rowProcessor = null) => {
    try {
        console.log('📊 Starting Excel parsing...');//לוג ראשון

        // Parse the Excel file using xlsx - optimize for large files
        let workbook;
        if (excelResponse instanceof ArrayBuffer) {
            // If it's already an ArrayBuffer, use it directly
            workbook = XLSX.read(excelResponse, { type: 'array' });
        } else if (Buffer.isBuffer(excelResponse)) {
            // If it's a Buffer, use it directly without conversion
            workbook = XLSX.read(excelResponse, { type: 'buffer' });
        } else {
            // Fallback to original method
            workbook = XLSX.read(new Uint8Array(excelResponse), { type: 'array' });
        }

        // Get the first sheet name
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        console.log('📋 Excel workbook parsed, processing sheet...');//לוג שני

        // Convert to JSON with headers - optimize for large datasets
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '', // Default value for empty cells
            raw: false // Parse values instead of keeping them raw
        });

        if (jsonData.length === 0) {
            console.log('⚠️ No data found in Excel file');
            return [];
        }

        // First row contains headers
        const headers = jsonData[0];
        console.log('📋 Headers found:', headers);

        // Convert data rows to structured objects with progress tracking
        console.log(`🔄 Processing ${jsonData.length - 1} data rows...`);
        const structuredData = [];
        
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowData = {};

            // Map headers to field names
            for (let headerIndex = 0; headerIndex < headers.length; headerIndex++) {
                const header = headers[headerIndex];
                const fieldName = headerMapping[header];
                if (fieldName && row[headerIndex] !== undefined && row[headerIndex] !== '') {
                    rowData[fieldName] = row[headerIndex];
                }
            }

            // Apply row processor if provided
            let processedRow;
            if (rowProcessor && typeof rowProcessor === 'function') {
                processedRow = rowProcessor(rowData, row, i - 1);
            } else {
                processedRow = rowData;
            }

            // Add to results if not empty
            if (processedRow && Object.keys(processedRow).length > 0) {
                structuredData.push(processedRow);
            }

            // Progress logging every 5000 rows
            if (i % 500 === 0) {
                console.log(`📊 Processed ${i - 1}/${jsonData.length - 1} rows`);
            }
        }

        console.log(`✅ Excel parsing completed. Total rows processed: ${structuredData.length}`);
        return structuredData;

    } catch (error) {
        console.error('💥 Error parsing Excel file:', error.message);
        throw new Error(`Excel parsing failed: ${error.message}`);
    }
};

module.exports = {
    formatDateTime,
    fixText,
    isDST,
    uploadFileBufferToStorage,
    createSTT,
    parseExcelToJson
}