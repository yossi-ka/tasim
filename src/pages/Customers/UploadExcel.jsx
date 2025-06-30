import { Button, Stack, Typography, Alert, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { useMutation } from 'react-query';
import { uploadCustomers } from '../../api/services/customers';
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

    return (
        <Stack spacing={2} sx={{ minWidth: 400, p: 2 }}>
            <Typography variant="h6" gutterBottom>
                העלאת קובץ לקוחות
            </Typography>
            
            <Typography variant="body2" color="text.secondary">
                הקובץ צריך להכיל את העמודות הבאות:
            </Typography>
            
            <Typography variant="caption" component="div" sx={{ 
                maxHeight: 200, 
                overflow: 'auto', 
                backgroundColor: 'grey.100', 
                p: 1, 
                borderRadius: 1 
            }}>
                {expectedHeaders.join(' | ')}
            </Typography>

            <Typography variant="body2" color="text.secondary">
                <strong>הערות חשובות:</strong>
                <br />
                • העמודה "מספר לקוח" חובה לכל רשומה
                <br />
                • העמודה "טלפון" יכולה להכיל כמה טלפונים מופרדים בפסיקים
                <br />
                • לקוחות עם מספר לקוח קיים לא יועלו
                <br />
                • נתמך קובץ CSV בלבד
            </Typography>

            {message.text && (
                <Alert severity={message.type} sx={{ mt: 2 }}>
                    {message.text}
                </Alert>
            )}

            <Button
                variant="contained"
                onClick={handleFileUpload}
                disabled={loading}
                sx={{ mt: 3 }}
                startIcon={loading ? <CircularProgress size={20} /> : null}
            >
                {loading ? 'מעלה קובץ...' : 'בחר קובץ CSV'}
            </Button>
        </Stack>
    );
};

export default UploadExcel;
