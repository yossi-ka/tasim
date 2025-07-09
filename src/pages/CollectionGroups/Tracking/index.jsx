import React from "react";
import {
    Box,
    Typography,
    Paper,
    Button,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import PrintIcon from "@mui/icons-material/Print";
import usePrint from "../../../context/hooks/print/usePrint";
import { useMutation, useQuery } from "react-query";
import { getCollectionGroupProductsWithOrders } from "../../../api/services/collectionGroups";
import Context from "../../../context";

const Tracking = ({ currentCollectionGroup }) => {

    const { getLookupName } = React.useContext(Context)
    const { handlePrint, printComponent } = usePrint();

    // קומפוננט הדפסה לכל מוצר
    const ProductPrintComponent = ({ product, currentPage, totalPages }) => {
        const now = new Date();
        const currentDate = now.toLocaleDateString('he-IL');
        const currentTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

        return (
            <Box sx={{
                pageBreakAfter: 'always',
                minHeight: '297mm',
                padding: '10mm',
                fontFamily: 'Arial, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* כותרת עליונה מוקטנת בפינה */}
                <Box sx={{ position: 'absolute', top: 0, right: 0, p: 1 }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#888' }}>בס"ד</Typography>
                </Box>

                {/* כותרת עם פרטי המוצר */}
                <Box sx={{ mb: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Box sx={{
                            flex: 1,
                            background: '#f4f4f4',
                            border: '1.5px solid #bbb',
                            borderRadius: '8px',
                            padding: '6px 0',
                            textAlign: 'center',
                            minWidth: 0
                        }}>
                            <Typography sx={{ fontSize: '13px', color: '#666', fontWeight: 700, mb: 0.5 }}>כמות כוללת</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '22px', color: '#222', lineHeight: 1 }}>{product.quantityOrWeight}</Typography>
                        </Box>
                        <Box sx={{
                            flex: 1,
                            background: '#f8f8f8',
                            border: '1.5px solid #bbb',
                            borderRadius: '8px',
                            padding: '6px 0',
                            textAlign: 'center',
                            minWidth: 0
                        }}>
                            <Typography sx={{ fontSize: '13px', color: '#666', fontWeight: 700, mb: 0.5 }}>מיקום</Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '20px', color: '#222', lineHeight: 1 }}>{product.productPlace || 'לא נקבע'}</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '18px', color: '#222', mb: 0.5 }}>{product.productName}</Typography>
                        <Typography sx={{ fontSize: '13px', color: '#666', fontStyle: 'italic' }}>
                            עובד אחראי: {getLookupName("employees", product.assignedEmployeeId) || 'לא נקבע'}
                        </Typography>
                    </Box>
                </Box>

                {/* טבלת ההזמנות */}
                <Box sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '6px 0 0 0',
                    border: '1px solid #e0e0e0',
                    minHeight: 0
                }}>
                    <TableContainer sx={{ width: '100%', flex: 1, borderRadius: '6px', overflow: 'hidden' }}>
                        <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow sx={{ background: '#f0f0f0', height: '32px' }}>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px' }}>מס' קרטון</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', background: '#ededed' }}>כמות</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px' }}>לקוח</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px' }}>כתובת</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {product.orders.map((orderItem, index) => (
                                    <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff', height: '28px' }}>
                                        <TableCell sx={{ border: 'none', fontSize: '12px', textAlign: 'center', padding: '2px 4px', fontWeight: 500 }}>{orderItem.order.collectionGroupOrder}</TableCell>
                                        <TableCell sx={{ border: 'none', fontSize: '12px', textAlign: 'center', background: '#ededed', fontWeight: 700, padding: '2px 4px', borderRadius: '2px' }}>{orderItem.product.quantityOrWeight}</TableCell>
                                        <TableCell sx={{ border: 'none', fontSize: '12px', textAlign: 'center', padding: '2px 4px', fontWeight: 500 }}>{`${orderItem.order.firstName || ''} ${orderItem.order.lastName || ''}`.trim()}</TableCell>
                                        <TableCell sx={{ border: 'none', fontSize: '12px', textAlign: 'center', padding: '2px 4px', color: '#555' }}>{orderItem.order.street}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* כותרת תחתונה קומפקטית */}
                <Box sx={{
                    mt: 1,
                    pt: 1,
                    borderTop: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fafafa',
                    borderRadius: '0 0 8px 8px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    color: '#888'
                }}>
                    <span>עמוד {currentPage} מתוך {totalPages}</span>
                    <span>הודפס ע"י מערכת כנפי נשרים</span>
                    <span>{currentTime} {currentDate}</span>
                </Box>
            </Box>
        );
    };

    const print = useMutation(() => getCollectionGroupProductsWithOrders(currentCollectionGroup.id), {
        onSuccess: (data) => {
            console.log("Data fetched successfully:", data);

            // יצירת עמודים להדפסה - עמוד לכל מוצר
            const pages = data.map((product, index) => (
                <ProductPrintComponent key={index} product={product} currentPage={index + 1} totalPages={data.length} />
            ));

            // הדפסה בגודל A4 רגיל
            handlePrint(pages);
        },
        onError: (error) => {
            console.error("Error fetching data:", error);
        }
    });

    const handlePrintPages = () => {
        // const pages = [

        // ];

        // // הדפסה בגודל A4 רגיל
        // handlePrint(pages);
    };
    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', minHeight: '400px' }}>


                <TrackChangesIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                    מעקב
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    כאן תוכל לעקוב אחר התקדמות העבודה
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    בקרוב יתווספו אפשרויות נוספות
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3 }}
                    onClick={print.mutate}
                    disabled={print.isLoading}
                    startIcon={print.isLoading ? <CircularProgress size={20} /> : <PrintIcon />}
                >
                    {print.isLoading ? 'מכין דוח...' : 'הדפסת דוח מוצרים להזמנה'}
                </Button>

                {printComponent}
            </Paper>
        </Box>
    );
};

export default Tracking;
