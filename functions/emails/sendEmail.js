const { request } = require('../api')

const sendEmail = async (data) => {
    const URL = "https://script.google.com/macros/s/AKfycbxAnddO41RmFDlhtsrKs0SoJoqp8reZoLA_oRPoKTn4LWY2uXJca8McTDKYjmNUblrF/exec";

    const res = await request(URL, "POST", { ...data, token: process.env.GOOGLE_SCRIPT_TOKEN })
    return res
}


module.exports = {
    sendEmail
}
