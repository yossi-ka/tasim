const { default: axios } = require("axios");


const yemotRequest = async (base, data = {}, options = {}) => {

    const YEMOT_API_BASE = "https://www.call2all.co.il/ym/api/";
    const TOKEN = process.env.YEMOT_TOKEN

    // אם זה בקשה להורדת קובץ, נוסיף responseType
    if (base === "DownloadFile") {
        options.responseType = 'arraybuffer';
    }

    if (typeof data === "string") {
        const URL = `${YEMOT_API_BASE}${base}?token=${TOKEN}&${data}`
        const res = await request(URL, "GET", null, options)
        return res
    } else {
        const URL = `${YEMOT_API_BASE}${base}`

        data.token = TOKEN;
        const res = await request(URL, "POST", data, options)
        return res
    }
}

const request = async (url, method, data, options = {}) => {
    try {
        const res = await axios({
            url,
            method,
            data,
            ...options
        });
        return res.data;

    } catch (e) {
        return {
            success: false,
            message: e.message
        }
    }
}

module.exports = {
    request,
    yemotRequest
}