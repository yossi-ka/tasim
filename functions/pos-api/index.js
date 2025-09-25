const express = require('express');
var cors = require('cors')
const { onRequest } = require('firebase-functions/v2/https');

const { login,
    checkUser
} = require('./services')

const app = express();

app.use(cors())

// Middleware to handle CORS preflight requests
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // For parsing form data

const checkUserFunc = (req, res, next) => {
    try {
        const token = req?.headers?.authorization?.split(' ')[1];
        checkUser(token).then(res => {

            if (res.userId == null) return res.json({
                status: "error",
                massege: "פרטי זיהוי שגויים"
            })
            console.log('***User id: ', res.userId);

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

app.get('/test',  async (req, res) => {
    // const { isAll, areaId } = req.query;

    const data = "Hello from test..."; // await getProducts(req.userId)

    return res.json({
        status: 'ok',
        data,
    })
})


exports.app = onRequest(app);



