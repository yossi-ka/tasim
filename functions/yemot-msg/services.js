const { yemotRequest } = require('../api');


const addToListAndSend = async (message, phone) => {
    try {

        const templateId = process.env.MESSAGE_YEMOT_TEMPLATE;
        if (!templateId) {
            throw new Error('לא נמצא מזהה תבנית הודעה פרטית בימות המשיח');
        }

        const add = await yemotRequest("UpdateTemplateEntry", {
            templateId,
            phone,
            blocked: 0
        })

        if (add.responseStatus !== 'OK') {
            throw new Error(`שגיאה בהוספת הטלפון לרשימה: ${add.message}`);
        }

        const sendTTS = await yemotRequest("SendTTS", {
            ttsMessage: message,
            repeatFile: 2,
            // ttsVoice,
            phones: phone,
        });

        if (sendTTS.responseStatus !== 'OK') {
            throw new Error(`שגיאה בשליחת הודעת TTS: ${sendTTS.message}`);
        }

        return {
            success: true,
            message: 'הטלפון נוסף לרשימה וההודעה נשלחה בהצלחה',
            addResult: add,
            sendResult: sendTTS
        }

    } catch (error) {
        console.error('Error in addToListAndSend:', error);
        throw new Error(`שגיאה בהוספת הטלפון לרשימה: ${error.message}`);
    }
}

const removeFromList = async (phone) => {
    try {
        const templateId = process.env.MESSAGE_YEMOT_TEMPLATE;
        if (!templateId) {
            throw new Error('לא נמצא מזהה תבנית הודעה פרטית בימות המשיח');
        }

        const remove = await yemotRequest("UpdateTemplateEntry", {
            templateId,
            phone,
            blocked: 1
        });

        if (remove.responseStatus !== 'OK') {
            throw new Error(`שגיאה בהסרת הטלפון מהרשימה: ${remove.message}`);
        }

        return {
            success: true,
            message: 'הטלפון הוסר מהרשימה בהצלחה',
            removeResult: remove
        };

    } catch (error) {
        console.error('Error in removeFromList:', error);
        throw new Error(`שגיאה בהסרת הטלפון מהרשימה: ${error.message}`);
    }
}

module.exports = {
    addToListAndSend,
    removeFromList
};