import { Button, Stack, Typography, Alert, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { useMutation } from 'react-query';
import { uploadOrders } from '../../api/services/orders';
import Context from "../../context";
import * as XLSX from 'xlsx';

const UploadExcel = ({ refetch }) => {
    const { user } = React.useContext(Context);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // useMutation להעלאת הזמנות
    const uploadOrdersMutation = useMutation((ordersData) => uploadOrders(ordersData, user.id), {
        onSuccess: (result) => {
            // הכנת הודעה מפורטת
            let successMessage = `עובדו ${result.totalProcessed} הזמנות: `;
            successMessage += `${result.newOrdersCount} הזמנות חדשות הועלו`;
            if (result.skippedCount > 0) {
                successMessage += `, ${result.skippedCount} הזמנות קיימות דולגו`;
            }

            setMessage({
                type: result.newOrdersCount > 0 ? 'success' : 'warning',
                text: successMessage
            });
            setLoading(false);
            console.log("end", new Date().getTime())
            refetch()

        },
        onError: (error) => {
            console.error('Error uploading orders:', error);
            setMessage({
                type: 'error',
                text: error.message || 'שגיאה בהעלאת ההזמנות'
            });
        }
    });

    // הכותרות הצפויות בקובץ Excel
    const expectedHeaders = [
        "מכירה", "מספר", "מצב", "שם משפחה", "שם פרטי", "נפתחה ב",
        "אושרה/נסגרה/בוטלה", "סכום", "יתרה", "תז", "תז בן זוג", "עיר",
        "רחוב", "בית", "כניסה", "דירה", "קומה", "מיקוד", "מספר כתובת",
        "הערת לקוח", "הערת הזמנה", "אמצעי תשלום", "טלפון", "אמייל", "מידע נוסף"
    ];

    // מיפוי הכותרות לשמות השדות
    const headerMapping = {
        "מכירה": "saleGroop",
        "מספר": "nbsOrderId",
        "מצב": "nbsOrderStatus",
        "שם משפחה": "lastName",
        "שם פרטי": "firstName",
        "נפתחה ב": "openedAt",
        "אושרה/נסגרה/בוטלה": "closedAt",
        "סכום": "totalPrice",
        "יתרה": "balance",
        "תז": "idNumber",
        "תז בן זוג": "partnerIdNumber",
        "עיר": "city",
        "רחוב": "street",
        "בית": "houseNumber",
        "כניסה": "entrance",
        "דירה": "apartment",
        "קומה": "floor",
        "מיקוד": "zipCode",
        "מספר כתובת": "addressNumber",
        "הערת לקוח": "customerNote",
        "הערת הזמנה": "orderNote",
        "אמצעי תשלום": "paymentMethod",
        "טלפון": "phone",
        "אמייל": "email",
        "מידע נוסף": "additionalInfo"
    };

    const handleFileUpload = () => {

        // יצירת אלמנט input מסוג file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        input.onchange = async (e) => {
            setLoading(true);
            console.log("start", new Date().getTime())

            const file = e.target.files[0];
            if (!file) return;

            setMessage({ type: '', text: '' });

            try {
                // קריאת הקובץ CSV באמצעות xlsx
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                // קבלת השמות של כל הגיליונות
                const sheetNames = workbook.SheetNames;
                if (sheetNames.length === 0) {
                    throw new Error('הקובץ לא מכיל נתונים');
                }

                // עבודה עם הגיליון הראשון (CSV הוא תמיד גיליון אחד)
                const worksheet = workbook.Sheets[sheetNames[0]];

                // המרה לפורמט JSON - כל שורה כמערך של ערכים
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length === 0) {
                    throw new Error('הקובץ ריק');
                }

                // השורה הראשונה היא הכותרות
                const fileHeaders = jsonData[0];
                const isValidHeaders = validateHeaders(fileHeaders);

                if (!isValidHeaders) {
                    throw new Error('כותרות הקובץ אינן תואמות לפורמט הנדרש');
                }

                // שאר השורות הן הנתונים
                const dataRows = jsonData.slice(1);

                // המרת הנתונים לפורמט הנדרש
                const ordersData = convertToOrdersFormat(dataRows, fileHeaders);

                if (ordersData.length === 0) {
                    throw new Error('לא נמצאו נתונים תקינים בקובץ');
                }

                // קריאה לפונקציית העלאה באמצעות mutation
                uploadOrdersMutation.mutate(ordersData);

            } catch (error) {
                console.error('Error processing file:', error);
                setMessage({
                    type: 'error',
                    text: error.message || 'שגיאה בעיבוד הקובץ'
                });
            } finally {
                // setLoading(false);
            }
        };

        // הפעלת בחירת הקובץ
        input.click();
    };

    const validateHeaders = (fileHeaders) => {
        if (fileHeaders.length !== expectedHeaders.length) {
            return false;
        }

        for (let i = 0; i < expectedHeaders.length; i++) {
            if (fileHeaders[i] !== expectedHeaders[i]) {
                return false;
            }
        }
        return true;
    };

    const convertToOrdersFormat = (rows, headers) => {
        // שדות מספר
        const numberFields = ['nbsOrderId', 'totalPrice', 'balance'];
        // שדות תאריך
        const dateFields = ['openedAt', 'closedAt'];

        return rows.map(row => {
            const orderData = {};

            headers.forEach((header, index) => {
                const fieldName = headerMapping[header];
                if (fieldName && row[index] !== undefined) {
                    let value = row[index];

                    // עיבוד מיוחד לפי סוג השדה
                    if (dateFields.includes(fieldName)) {
                        if (value && value !== '') {
                            // טיפול בתאריכים מ-CSV (כולל שעה)
                            const parsedDate = new Date(value);
                            if (!isNaN(parsedDate.getTime())) {
                                value = parsedDate;
                            } else {
                                // ננסה פורמטים נוספים של תאריך
                                // פורמט ישראלי: dd/mm/yyyy hh:mm
                                const israeliDateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(\s+\d{1,2}:\d{2})?/;
                                const match = value.match(israeliDateRegex);
                                if (match) {
                                    const [, day, month, year, time] = match;
                                    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${time || ''}`;
                                    const date = new Date(dateStr);
                                    if (!isNaN(date.getTime())) {
                                        value = date;
                                    } else {
                                        value = null;
                                    }
                                } else {
                                    value = null;
                                }
                            }
                        } else {
                            value = null;
                        }
                    } else if (numberFields.includes(fieldName)) {
                        if (value && !isNaN(value)) {
                            value = Number(value);
                        }
                    } else {
                        value = String(value || '');
                    }

                    orderData[fieldName] = value;
                }
            });

            return orderData;
        }).filter(order => order.nbsOrderId); // סינון רק הזמנות עם מספר הזמנה
    };

    return (<>
        {!message.text ? <Stack direction="column" spacing={3}>
            <Typography color="primary.main" variant="h4">כאן ניתן לעלות קובץ הזמנות</Typography>
            <Typography color="primary.main" variant="h5">המערכת בודקת את השורות ומעלה רק שורות שעדיין לא עלו</Typography>
            <Typography
                color="primary.dark"
                variant="h5"
                component="a"
                href="https://sales-v2.nbs-app.net/report/orders/"
                target="_blank"
            >
                למעבר למסך דוחות
            </Typography>



            <Button
                color="primary"
                variant="contained"
                onClick={handleFileUpload}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
            >
                {loading ? 'מעלה קובץ...' : 'העלאת קובץ (CSV/Excel)'}
            </Button>

            <Typography variant="body2" color="text.secondary">
                הכותרות הצפויות בקובץ:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {expectedHeaders.join(' | ')}
            </Typography>
        </Stack>
            :
            <Alert severity={message.type === 'error' ? 'error' : message.type === 'warning' ? 'warning' : 'success'}>
                {message.text}
            </Alert>
        }
    </>
    );
}

export default UploadExcel;