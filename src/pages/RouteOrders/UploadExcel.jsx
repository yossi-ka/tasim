import { Button, Stack, Typography, Alert, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import { useMutation } from 'react-query';
import { uploadRouteOrders } from '../../api/services/routeOrders';
import Context from "../../context";
import * as XLSX from 'xlsx';

const UploadRouteOrders = ({ refetch }) => {
    const { user } = React.useContext(Context);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // useMutation להעלאת סדרי מסלולים
    const uploadRouteOrdersMutation = useMutation((routeOrdersData) => uploadRouteOrders(routeOrdersData, user.id), {
        onSuccess: (result) => {
            // הכנת הודעה מפורטת
            let successMessage = `עובדו ${result.totalProcessed} סדרי מסלולים: `;
            successMessage += `${result.newRouteOrdersCount} סדרי מסלולים חדשים הועלו`;
            if (result.skippedCount > 0) {
                successMessage += `, ${result.skippedCount} סדרי מסלולים קיימים דולגו`;
            }

            setMessage({
                type: result.newRouteOrdersCount > 0 ? 'success' : 'warning',
                text: successMessage
            });
            setLoading(false);
            console.log("end", new Date().getTime())
            refetch()

        },
        onError: (error) => {
            console.error('Error uploading route orders:', error);
            setMessage({
                type: 'error',
                text: error.message || 'שגיאה בהעלאת סדרי המסלולים'
            });
            setLoading(false);
        }
    });

    // הכותרות הצפויות בקובץ Excel
    const expectedHeaders = [
        "רחוב", "בנין", "מספר סדר"
    ];

    // מיפוי הכותרות לשמות השדות
    const headerMapping = {
        "רחוב": "street",
        "בנין": "buildingNumber",
        "מספר סדר": "orderNumber"
    };

    const handleFileUpload = () => {
        // יצירת אלמנט input מסוג file
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx,.xls';

        input.onchange = async (e) => {
            setLoading(true);
            console.log("start", new Date().getTime())

            const file = e.target.files[0];
            if (!file) return;

            setMessage({ type: '', text: '' });

            try {
                // קריאת הקובץ Excel באמצעות xlsx
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                // קבלת השמות של כל הגיליונות
                const sheetNames = workbook.SheetNames;
                if (sheetNames.length === 0) {
                    throw new Error('הקובץ ריק או לא תקין');
                }

                // קריאת הגיליון הראשון
                const worksheet = workbook.Sheets[sheetNames[0]];

                // המרה ל-JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length === 0) {
                    throw new Error('הגיליון ריק');
                }

                // שורת הכותרות
                const headers = jsonData[0];
                const dataRows = jsonData.slice(1);

                console.log('Headers found:', headers);
                console.log('Sample data row:', dataRows[0]);

                // ולידציה של הכותרות
                const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
                if (missingHeaders.length > 0) {
                    throw new Error(`חסרות הכותרות הבאות: ${missingHeaders.join(', ')}`);
                }

                // המרת הנתונים לפורמט הנדרש
                const routeOrdersData = [];
                for (let i = 0; i < dataRows.length; i++) {
                    const row = dataRows[i];
                    if (!row || row.length === 0) continue; // דילוג על שורות ריקות

                    const routeOrderData = {};
                    
                    // מיפוי הנתונים לפי הכותרות
                    headers.forEach((header, index) => {
                        if (headerMapping[header]) {
                            const value = row[index];
                            if (value !== undefined && value !== null && value !== '') {
                                const fieldName = headerMapping[header];
                                if (fieldName === 'buildingNumber' || fieldName === 'orderNumber') {
                                    // המרה למספר עבור buildingNumber ו-orderNumber
                                    const numValue = Number(String(value).trim());
                                    if (!isNaN(numValue)) {
                                        routeOrderData[fieldName] = numValue;
                                    } else {
                                        console.warn(`Invalid number value for ${fieldName}:`, value);
                                    }
                                } else {
                                    // שדה טקסט רגיל
                                    routeOrderData[fieldName] = String(value).trim();
                                }
                            }
                        }
                    });

                    // ולידציה שיש את השדות החובה
                    if (routeOrderData.street && routeOrderData.buildingNumber && routeOrderData.orderNumber) {
                        routeOrdersData.push(routeOrderData);
                    } else {
                        console.warn(`Row ${i + 1} missing required fields:`, routeOrderData);
                    }
                }

                if (routeOrdersData.length === 0) {
                    throw new Error('לא נמצאו שורות תקינות בקובץ');
                }

                console.log(`Processing ${routeOrdersData.length} route orders`);

                // שליחת הנתונים לשרת
                uploadRouteOrdersMutation.mutate(routeOrdersData);

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

    return (<>
        {!message.text ? <Stack direction="column" spacing={3}>
            <Typography color="primary.main" variant="h4">כאן ניתן לעלות קובץ סדרי מסלולים</Typography>
            <Typography color="primary.main" variant="h5">המערכת בודקת את השורות ומעלה רק שורות שעדיין לא עלו</Typography>

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
};

export default UploadRouteOrders;
