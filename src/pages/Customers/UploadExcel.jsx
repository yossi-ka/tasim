import { Button, Stack, Typography, Alert, CircularProgress, Divider } from "@mui/material";
import React, { useState } from "react";
import { useMutation } from 'react-query';
import { uploadCustomers, updateCustomersDeliveryIndex } from '../../api/services/customers';
import Context from "../../context";
import * as XLSX from 'xlsx';

const UploadExcel = ({ refetch }) => {
    const { user } = React.useContext(Context);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // useMutation להעלאת לקוחות
    const uploadCustomersMutation = useMutation((customersData) => uploadCustomers(customersData, user.id), {
        onSuccess: (result) => {
            // הכנת הודעה מפורטת
            let successMessage = `עובדו ${result.totalProcessed} לקוחות: `;
            successMessage += `${result.newCustomersCount} לקוחות חדשים הועלו`;
            if (result.skippedCount > 0) {
                successMessage += `, ${result.skippedCount} לקוחות קיימים דולגו`;
            }

            setMessage({
                type: result.newCustomersCount > 0 ? 'success' : 'warning',
                text: successMessage
            });
            setLoading(false);
            console.log("end", new Date().getTime())
            refetch()

        },
        onError: (error) => {
            console.error('Error uploading customers:', error);
            setMessage({
                type: 'error',
                text: error.message || 'שגיאה בהעלאת הלקוחות'
            });
        }
    });

    // useMutation לעדכון deliveryIndex
    const updateDeliveryIndexMutation = useMutation((deliveryData) => updateCustomersDeliveryIndex(deliveryData, user.id), {
        onSuccess: (result) => {
            // הכנת הודעה מפורטת
            let successMessage = `עובדו ${result.totalProcessed} שורות: `;
            successMessage += `${result.updatedCount} לקוחות עודכנו`;
            if (result.skippedCount > 0) {
                successMessage += `, ${result.skippedCount} שורות דולגו`;
            }
            if (result.notFoundCount > 0) {
                successMessage += `, ${result.notFoundCount} לקוחות לא נמצאו`;
            }

            setMessage({
                type: result.updatedCount > 0 ? 'success' : 'warning',
                text: successMessage
            });
            setLoading(false);
            console.log("end delivery update", new Date().getTime())
            refetch()

        },
        onError: (error) => {
            console.error('Error updating delivery index:', error);
            setMessage({
                type: 'error',
                text: error.message || 'שגיאה בעדכון אינדקס המשלוח'
            });
        }
    });

    // הכותרות הצפויות בקובץ Excel
    const expectedHeaders = [
        "מספר לקוח", "שם משפחה", "שם פרטי", "ת.ז", "ת.לידה", "שם בן/בת זוג",
        "ת.ז בן/בת זוג", "ת.לידה", "עיר", "רחוב", "בית", "כניסה", "דירה",
        "קומה", "מיקוד", "שכונה", "דואר אלקטרוני", "זיכוי", "ת. הרשמה",
        "הערת לקוח", "א. תשלום שמור", "טלפון", "תיוג"
    ];

    // מיפוי הכותרות לשמות השדות
    const headerMapping = {
        "מספר לקוח": "customerNumber",
        "שם משפחה": "lastName",
        "שם פרטי": "firstName",
        "ת.ז": "idNumber",
        "ת.לידה": "birthDate",
        "שם בן/בת זוג": "spouseName",
        "ת.ז בן/בת זוג": "spouseIdNumber",
        "ת.לידה בן/בת זוג": "spouseBirthDate",
        "עיר": "city",
        "רחוב": "street",
        "בית": "houseNumber",
        "כניסה": "entrance",
        "דירה": "apartment",
        "קומה": "floor",
        "מיקוד": "zipCode",
        "שכונה": "neighborhood",
        "דואר אלקטרוני": "email",
        "זיכוי": "credit",
        "ת. הרשמה": "registrationDate",
        "הערת לקוח": "customerNote",
        "א. תשלום שמור": "savedPaymentMethod",
        "טלפון": "phones",
        "תיוג": "tags"
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
                    throw new Error('הקובץ לא מכיל גיליונות');
                }

                // קריאת הגיליון הראשון
                const worksheet = workbook.Sheets[sheetNames[0]];

                // המרה ל-JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length === 0) {
                    throw new Error('הקובץ ריק');
                }

                // שורת הכותרות
                const headers = jsonData[0];
                const dataRows = jsonData.slice(1);

                console.log('Headers found:', headers);
                console.log('Sample data row:', dataRows[0]);

                // ולידציה של הכותרות
                const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
                if (missingHeaders.length > 0) {
                    console.warn('Missing headers:', missingHeaders);
                    // לא נזרוק שגיאה, אלא נתריע במקום
                }

                // המרת הנתונים
                const customersData = [];
                
                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    
                    // דילוג על שורות ריקות
                    if (!row || row.every(cell => !cell)) continue;

                    const customerData = {};
                    
                    // מיפוי כל עמודה
                    headers.forEach((header, index) => {
                        const fieldName = headerMapping[header];
                        if (fieldName && row[index] !== undefined && row[index] !== null && row[index] !== '') {
                            let value = row[index];
                            
                            // טיפול מיוחד בטלפונים - הפרדה לפי פסיקים למערך
                            if (fieldName === 'phones' && typeof value === 'string') {
                                customerData[fieldName] = value.split(',').map(phone => phone.trim()).filter(phone => phone);
                            }
                            // טיפול בתאריכים
                            else if (fieldName.includes('Date') && value) {
                                // אם זה מספר Excel (serial number)
                                if (typeof value === 'number') {
                                    const excelDate = new Date((value - 25569) * 86400 * 1000);
                                    customerData[fieldName] = excelDate.toISOString().split('T')[0]; // YYYY-MM-DD
                                } else {
                                    customerData[fieldName] = value;
                                }
                            }
                            // טיפול במספרים
                            else if (fieldName === 'credit' && value) {
                                customerData[fieldName] = parseFloat(value) || 0;
                            }
                            else {
                                customerData[fieldName] = value;
                            }
                        }
                    });

                    // ולידציה - חובה שיהיה מספר לקוח
                    if (!customerData.customerNumber) {
                        console.warn(`שורה ${i + 2}: לא נמצא מספר לקוח, מדלג על השורה`);
                        continue;
                    }

                    customersData.push(customerData);
                }

                console.log(`Processed ${customersData.length} customers from ${dataRows.length} rows`);

                if (customersData.length === 0) {
                    throw new Error('לא נמצאו לקוחות תקינים בקובץ');
                }

                // העלאת הנתונים
                await uploadCustomersMutation.mutateAsync(customersData);

            } catch (error) {
                console.error('Error processing file:', error);
                setMessage({
                    type: 'error',
                    text: error.message || 'שגיאה בעיבוד הקובץ'
                });
                setLoading(false);
            }
        };

        // הפעלת בחירת הקובץ
        input.click();
    };

    const handleDeliveryIndexUpload = () => {
        // יצירת אלמנט input מסוג file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';

        input.onchange = async (e) => {
            setLoading(true);
            console.log("start delivery index update", new Date().getTime())

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
                    throw new Error('הקובץ לא מכיל גיליונות');
                }

                // קריאת הגיליון הראשון
                const worksheet = workbook.Sheets[sheetNames[0]];

                // המרה ל-JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length === 0) {
                    throw new Error('הקובץ ריק');
                }

                // שורת הכותרות
                const headers = jsonData[0];
                const dataRows = jsonData.slice(1);

                console.log('Headers found:', headers);
                console.log('Sample data row:', dataRows[0]);

                // ולידציה של הכותרות - צריך להיות בדיוק 2 עמודות
                const expectedDeliveryHeaders = ["מספר סדר", "מספר לקוח"];
                const missingHeaders = expectedDeliveryHeaders.filter(header => !headers.includes(header));
                if (missingHeaders.length > 0) {
                    throw new Error(`חסרות כותרות: ${missingHeaders.join(', ')}`);
                }

                // מיפוי הכותרות
                const deliveryHeaderMapping = {
                    "מספר סדר": "deliveryIndex",
                    "מספר לקוח": "customerNumber"
                };

                // המרת הנתונים
                const deliveryData = [];
                
                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    
                    // דילוג על שורות ריקות
                    if (!row || row.every(cell => !cell)) continue;

                    const deliveryItem = {};
                    
                    // מיפוי כל עמודה
                    headers.forEach((header, index) => {
                        const fieldName = deliveryHeaderMapping[header];
                        if (fieldName && row[index] !== undefined && row[index] !== null && row[index] !== '') {
                            let value = row[index];
                            
                            // המרה למספר עבור deliveryIndex ו-customerNumber
                            if (fieldName === 'deliveryIndex' || fieldName === 'customerNumber') {
                                deliveryItem[fieldName] = parseInt(value) || value;
                            } else {
                                deliveryItem[fieldName] = value;
                            }
                        }
                    });

                    // ולידציה - חובה שיהיה גם deliveryIndex וגם customerNumber
                    if (!deliveryItem.deliveryIndex || !deliveryItem.customerNumber) {
                        console.warn(`שורה ${i + 2}: חסר מספר סדר או מספר לקוח, מדלג על השורה`);
                        continue;
                    }

                    deliveryData.push(deliveryItem);
                }

                console.log(`Processed ${deliveryData.length} delivery updates from ${dataRows.length} rows`);

                if (deliveryData.length === 0) {
                    throw new Error('לא נמצאו שורות תקינות בקובץ');
                }

                // עדכון deliveryIndex
                await updateDeliveryIndexMutation.mutateAsync(deliveryData);

            } catch (error) {
                console.error('Error processing delivery file:', error);
                setMessage({
                    type: 'error',
                    text: error.message || 'שגיאה בעיבוד קובץ אינדקס המשלוח'
                });
                setLoading(false);
            }
        };

        // הפעלת בחירת הקובץ
        input.click();
    };

    return (<>
        {!message.text ? <Stack direction="column" spacing={3}>
            <Typography color="primary.main" variant="h4">כאן ניתן לעלות קובץ לקוחות</Typography>
            <Typography color="primary.main" variant="h5">המערכת בודקת את השורות ומעלה רק שורות שעדיין לא עלו</Typography>
            <Typography
                color="primary.dark"
                variant="h5"
                component="a"
                href="https://sales-v2.nbs-app.net/customer/list/"
                target="_blank"
            >
                למעבר למסך לקוחות
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

            <Divider sx={{ my: 3 }} />

            <Typography color="primary.main" variant="h4">עדכון אינדקס משלוח</Typography>
            <Typography color="primary.main" variant="h5">העלאת קובץ עם מספר סדר ומספר לקוח לעדכון אינדקס המשלוח</Typography>

            <Button
                color="secondary"
                variant="contained"
                onClick={handleDeliveryIndexUpload}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
            >
                {loading ? 'מעדכן אינדקס משלוח...' : 'עדכון אינדקס משלוח (CSV)'}
            </Button>

            <Typography variant="body2" color="text.secondary">
                הכותרות הצפויות בקובץ אינדקס משלוח:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                מספר סדר | מספר לקוח
            </Typography>
        </Stack>
            :
            <Alert severity={message.type === 'error' ? 'error' : message.type === 'warning' ? 'warning' : 'success'}>
                {message.text}
            </Alert>
        }
    </>
    );
};

export default UploadExcel;
