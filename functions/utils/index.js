const FormData = require('form-data');
const axios = require('axios');
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

module.exports = {
    formatDateTime,
    fixText,
    isDST,
    uploadFileBufferToStorage,
    createSTT
}