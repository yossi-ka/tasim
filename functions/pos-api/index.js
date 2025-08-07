const express = require('express');
var cors = require('cors')
const { onRequest } = require('firebase-functions/v2/https');

const { login,
    checkUser,
    getOrders,
    approveOrders,
    sendMessage,
    getProducts,
    approveProducts,
    getOrderProducts,
    approveOrderProducts,
    getProductsShipping,
    approveProductsShipping
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


app.get('/products', checkUserFunc, async (req, res) => {
    // const { isAll, areaId } = req.query;

    const data = await getProducts(req.userId)

    return res.json({
        status: 'ok',
        data,
    })
})

app.post('/approveProducts', checkUserFunc, async (req, res) => {
    try {
        let products;

        // Parse form data to convert it to proper array format
        if (req.body.products && !Array.isArray(req.body.products)) {
            // Convert form data format to array
            products = [];
            const formData = req.body.products;

            // Get all indices from form data
            const indices = new Set();
            Object.keys(formData).forEach(key => {
                const match = key.match(/\[(\d+)\]/);
                if (match) {
                    indices.add(parseInt(match[1]));
                }
            });

            // Build products array from form data
            indices.forEach(index => {
                const product = {};
                if (formData[`[${index}][id]`]) product.id = formData[`[${index}][id]`];
                if (formData[`[${index}][cartIndex]`]) product.cartIndex = parseInt(formData[`[${index}][cartIndex]`]);
                products.push(product);
            });
        } else {
            // Original JSON format - keep this for when client is updated
            products = req.body.products;
        }

        if (Array.isArray(products) && products.length > 0) {
            // Original validation code - keep this for when client sends JSON
            // const isValidFormat = products.every(product => 
            //     product && typeof product === 'object' && 
            //     typeof product.id === 'string' && 
            //     typeof product.cartIndex === 'number'
            // );

            // Modified validation for form data compatibility
            const isValidFormat = products.every(product =>
                product && typeof product === 'object' &&
                typeof product.id === 'string' &&
                (typeof product.cartIndex === 'number' || typeof product.cartIndex === 'string')
            );

            if (!isValidFormat) {
                return res.json({
                    status: "error",
                    massege: "פורמט לא תקין - נדרש מערך של אובייקטים עם id ו-cartIndex"
                })
            }

            const approve = await approveProducts(products, req.userId)
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
            massege: "חסר מזהה מוצר"
        })
    }
    catch (e) {
        console.error("Error in approveProducts:", e);
        return res.json({
            status: "error",
            massege: e.massege || "שגיאה בעדכון המוצרים"
        })
    }
})
app.get('/orderProducts', checkUserFunc, async (req, res) => {
    // const { isAll, areaId } = req.query;

    const data = await getOrderProducts(req.userId, req.query.viewMode)

    return res.json({
        status: 'ok',
        data,
    })
})

app.post('/approveOrderProducts', checkUserFunc, async (req, res) => {
    try {
        const { orderProducts } = req.body;

        if (Array.isArray(orderProducts) && orderProducts.length > 0) {
            const approve = await approveOrderProducts(orderProducts, req.userId)
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
            massege: "חסר מזהה מוצר"
        })
    }
    catch (e) {
        return res.json({
            status: "error",
            massege: e.massege || "שגיאה בעדכון המוצרים"
        })
    }
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
        const { orders, isTzintuk = true } = req.body;

        if (Array.isArray(orders) && orders.length > 0) {
            const approve = approveOrders(orders, isTzintuk, req.userId)
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


app.get('/productsShipping', checkUserFunc, async (req, res) => {
    // const { isAll, areaId } = req.query;

    const data = await getProductsShipping(req.userId)

    return res.json({
        status: 'ok',
        data,
    })
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



