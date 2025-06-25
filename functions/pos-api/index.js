const express = require('express');
var cors = require('cors')
const { onRequest } = require('firebase-functions/v2/https');

const { login, checkUser, getOrders, approveOrders, sendMessage } = require('./services')

const app = express();

app.use(cors())

app.use(express.json())

const checkUserFunc = (req, res, next) => {
    try {
        const token = req?.headers?.authorization?.split(' ')[1];
        checkUser(token).then(res => {

            if (res.userId == null) return res.json({
                status: "error",
                massege: "פרטי זיהוי שגויים"
            })
            req.userId = res.userId;
            req.userType = res.userType;
            next()
        })
    } catch (e) {
        return res.json({
            status: "error",
            massege: "פרטי זיהוי שגויים"
        })
    }
}



app.post('/login', async (req, res) => {

    const { userName, password, cardNumber } = req.body;

    const userData = await login(userName, password, cardNumber)
    if (userData == null) {
        return res.json({
            status: "error",
            massege: "פרטי זיהוי שגויים"
        })
    }

    return res.json({
        status: "ok",
        ...userData
    })
})


app.get('/orders', checkUserFunc, async (req, res) => {
    // const { isAll, areaId } = req.query;

    const data = await getOrders(req.userId)

    return res.json({
        status: 'ok',
        data,
    })
})


app.post('/approveOrders', checkUserFunc, async (req, res) => {
    try {
        const { orders } = req.body;

        if (Array.isArray(orders) && orders.length > 0) {
            const approve = approveOrders(orders, req.userId)
            if (!approve) return res.json({
                status: "error",
                massege: "שגיאה"
            })
            return res.json({
                status: 'ok',
                massege: 'העדכון התקבל בהצלחה'
            })
        }
        return res.json({
            status: "error",
            massege: "חסר מזהה הזמנה"
        })
    } catch (e) {
        return res.json({
            status: "error",
            massege: e.massege || "שגיאה בעדכון ההזמנות"
        })
    }
})

app.post('/message', checkUserFunc, async (req, res) => {
    try {
        const { orderId, message } = req.body;


        if (!message) return res.json({
            status: "error",
            massege: "אין הודעה"
        })

        const resM = await sendMessage(orderId, message, req.userId)
        if (!resM) return res.json({
            status: "error",
            massege: "שגיאה בשליחת ההודעה"
        })


        return res.json({
            status: 'ok',
            massege: "הודעה התקבלה"
        })
    } catch (e) {
        console.log("1111", e)
        return res.json({
            status: "error",
            massege: "שגיאה בשליחת ההודעה"
        })
    }
})

exports.app = onRequest(app)



