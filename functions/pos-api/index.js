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
    getEmployeesToOrders,
    approveEmployeesToOrders,
    getOrderProductsV2,
    removeEmployeeToOrder,
    approvePrintQueue,
    getCompletedOrders,
    getCompletedSingleOrder,
    closeOrder
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

    const data = await getOrderProductsV2(req.userId, req.query.viewMode)

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

app.get('/employeesToOrders', checkUserFunc, async (req, res) => {
    // const { isAll, areaId } = req.query;
    console.log('***filterParams: ', req.headers.filterparams);

    const data = await getEmployeesToOrders(req.userId, req.headers.filterparams)

    return res.json({
        status: 'ok',
        data,
    })
})

app.post('/approveEmployeesToOrders', checkUserFunc, async (req, res) => {
    try {
        const { ordersArr } = req.body;
        console.log("***!!!ordersArr", ordersArr);


        if (Array.isArray(ordersArr) && ordersArr.length > 0) {
            const approve = await approveEmployeesToOrders(ordersArr, req.userId);
            console.log("***approve result:", approve);

            if (!approve) return res.json({
                status: "error",
                massege: "ההזמנה כבר בליקוט"
            })
            return res.json({
                status: 'ok',
                massege: 'העדכון התקבל בהצלחה'
            })
        }
        return res.json({
            status: "error",
            massege: "חסר מזהה עובד"
        })
    }
    catch (e) {
        return res.json({
            status: "error",
            massege: e.massege || "שגיאה בעדכון העובדים"
        })
    }
})

app.post('/removeEmployeeToOrder', checkUserFunc, async (req, res) => {
    try {
        const { orderId } = req.body;
        console.log("***removeEmployeeToOrder", { orderId, userId: req.userId });

        if (!orderId) {
            return res.json({
                status: "error",
                massege: "חסר מזהה הזמנה"
            });
        }

        const result = await removeEmployeeToOrder(orderId, req.userId);

        if (!result) {
            return res.json({
                status: "error",
                massege: "לא נמצאה הזמנה פעילה למחיקה"
            });
        }

        return res.json({
            status: 'ok',
            massege: 'ההזמנה שוחררה בהצלחה'
        });

    } catch (e) {
        console.error("Error in removeEmployeeToOrder endpoint:", e);
        return res.json({
            status: "error",
            massege: e.message || "שגיאה בשחרור ההזמנה"
        });
    }
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

app.post('/approvePrintQueue', checkUserFunc, async (req, res) => {
    try {
        const { type, docId } = req.body;
        const userId = req.userId;
        if (!type || !docId) {
            return res.json({ status: 'error', massege: 'חסרים פרמטרים' });
        }
        const { success, msg } = await approvePrintQueue(type, docId, userId);
        if (!success) {
            return res.json({ status: 'error', massege: msg || 'שגיאה באישור ההדפסה' });
        }
        return res.json({ status: 'ok', massege: msg || 'ההדפסה אושרה בהצלחה' });
    } catch (e) {
        console.error('Error in approvePrintQueue endpoint:', e);
        return res.json({ status: 'error', massege: e.message || 'שגיאה באישור ההדפסה' });
    }
})

app.get('/completedOrders', checkUserFunc, async (req, res) => {
    try {
        const userId = req.userId;
        const completedOrders = await getCompletedOrders(userId);
        return res.json({
            status: 'ok',
            data: completedOrders
        });
    } catch (e) {
        console.error('Error in completedOrders endpoint:', e);
        return res.json({
            status: 'error',
            massege: e.message || 'שגיאה בשליפת ההזמנות המושלמות'
        });
    }
});

app.get('/completedSingleOrder', checkUserFunc, async (req, res) => {
    try {
        const { collectionIndex } = req.query;
        const completedOrder = await getCompletedSingleOrder(collectionIndex);
        return res.json({
            status: 'ok',
            data: completedOrder
        });
    } catch (e) {
        console.error('*** Error in completedSingleOrder endpoint:', e);
        return res.json({
            status: 'error',
            massege: e.message || 'שגיאה בשליפת ההזמנה'
        });
    }
});

app.post('/closeOrder', checkUserFunc, async (req, res) => {
    const { orderId } = req.body;
    if (!orderId) {
        return res.json({
            status: "error",
            massege: "חסר מזהה הזמנה"
        });
    }
    const result = await closeOrder(orderId);

    if (!result.success) {

        return res.json({
            status: "error",
            massege: result.msg || "שגיאה בסגירת ההזמנה"
        });
    }
    return res.json({
        status: 'ok',
        massege: result.msg || 'ההזמנה נסגרה בהצלחה'
    });
});


exports.app = onRequest(app);



