import { Button, Stack, Typography, Alert, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { useMutation } from 'react-query';
import { uploadProducts } from '../../api/services/products';
import Context from "../../context";
import * as XLSX from 'xlsx';

const UploadExcel = ({ refetch }) => {
    const { user } = React.useContext(Context);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // useMutation להעלאת מוצרים
    const uploadProductsMutation = useMutation((productsData) => uploadProducts(productsData, user.id), {
        onSuccess: (result) => {
            // הכנת הודעה מפורטת
            let successMessage = `עובדו ${result.totalProcessed} מוצרים: `;
            successMessage += `${result.newProductsCount} מוצרים חדשים הועלו`;
            if (result.skippedCount > 0) {
                successMessage += `, ${result.skippedCount} מוצרים קיימים דולגו`;
            }

            setMessage({
                type: result.newProductsCount > 0 ? 'success' : 'warning',
                text: successMessage
            });
            setLoading(false);
            console.log("end", new Date().getTime())
            refetch()

        },
        onError: (error) => {
            console.error('Error uploading products:', error);
            setMessage({
                type: 'error',
                text: error.message || 'שגיאה בהעלאת המוצרים'
            });
        }
    });

    // הכותרות הצפויות בקובץ Excel
    const expectedHeaders = [
        "קוד", "שם מוצר", "קטגוריה", "מק\"ט טלפוני", "מצב", "לפי משקל", "מחיר", "הערה", "פטור ממע\"מ"
    ];

    // מיפוי הכותרות לשמות השדות
    const headerMapping = {
        "קוד": "nbsProductId",
        "שם מוצר": "name",
        "קטגוריה": "category",
        "מק\"ט טלפוני": "phoneCode",
        "מצב": "nbsStatus",
        "לפי משקל": "isByWeight",
        "מחיר": "price",
        "הערה": "note",
        "פטור ממע\"מ": "isVatExempt"
    };

    const handleFileUpload = () => {

        // יצירת אלמנט input מסוג file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv, .xlsx, .xls'; // קבצי CSV ו-Excel

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
                const productsData = convertToProductsFormat(dataRows, fileHeaders);

                if (productsData.length === 0) {
                    throw new Error('לא נמצאו נתונים תקינים בקובץ');
                }

                // קריאה לפונקציית העלאה באמצעות mutation
                uploadProductsMutation.mutate(productsData);

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

    const convertToProductsFormat = (rows, headers) => {
        // שדות מספר
        const numberFields = ['nbsProductId', 'price'];
        // שדות בוליאנים
        const booleanFields = ['isByWeight', 'isVatExempt'];

        return rows.map(row => {
            const productData = {};

            headers.forEach((header, index) => {
                const fieldName = headerMapping[header];
                if (fieldName && row[index] !== undefined) {
                    let value = row[index];

                    // עיבוד מיוחד לפי סוג השדה
                    if (booleanFields.includes(fieldName)) {
                        // המרה לבוליאני - אם הערך הוא "כן", true או 1
                        value = value === 'כן' || value === true || value === 1 || value === '1';
                    } else if (numberFields.includes(fieldName)) {
                        if (value && !isNaN(value)) {
                            value = Number(value);
                        }
                    } else if (fieldName === 'name') {
                        // עיבוד מיוחד לשם המוצר - הוצאת מיקום המוצר מהסוגריים
                        value = String(value || '');
                        
                        // שמירת השם המקורי
                        productData.orginalFullName = value;
                        
                        // חיפוש הסוגריים הראשונות והוצאת התוכן שלהן
                        const locationMatch = value.match(/\(([^)]+)\)/);
                        if (locationMatch) {
                            // הכנסת המיקום לשדה נפרד
                            productData.productPlace = locationMatch[1].trim();
                            // הסרת הסוגריים עם התוכן משם המוצר
                            value = value.replace(/\([^)]+\)/, '').trim();
                        }
                        
                        // הסרת פסיק בתחילת השם אם קיים
                        if (value.startsWith(',')) {
                            value = value.substring(1);
                        }
                        
                        // ביצוע trim על השם
                        value = value.trim();
                    } else {
                        value = String(value || '');
                    }

                    productData[fieldName] = value;
                }
            });

            return productData;
        }).filter(product => product.nbsProductId); // סינון רק מוצרים עם קוד מוצר
    };

    return (<>
        {!message.text ? <Stack direction="column" spacing={3}>
            <Typography color="primary.main" variant="h4">כאן ניתן לעלות קובץ מוצרים</Typography>
            <Typography color="primary.main" variant="h5">המערכת בודקת את השורות ומעלה רק שורות שעדיין לא עלו</Typography>
            <Typography
                color="primary.dark"
                variant="h5"
                component="a"
                href="https://sales-v2.nbs-app.net/product/catalog/list/"
                target="_blank"
            >
                למעבר למסך מוצרים
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
