const { default: axios } = require("axios");



const request = async (url, method, data) => {
    try {
        const res = await axios({
            url,
            method,
            data
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
    request
}