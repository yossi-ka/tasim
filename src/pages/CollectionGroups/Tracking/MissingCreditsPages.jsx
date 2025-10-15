
import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider } from "@mui/material";


const MissingCreditsPages = ({ orders }) => {
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
            position: 'relative',
            background: '#fff',
            height: '100%',
        }}>
            {/* כותרת עליונה מוקטנת בפינה */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, p: 1 }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#888' }}>בס"ד</Typography>
            </Box>

            <Typography sx={{ fontWeight: 900, fontSize: '30px', color: '#000', textAlign: 'center', mb: 2 }}>
                דוח זיכויים ללקוחות
            </Typography>

            {orders.map((order, idx) => {
                const totalCredit = (order.missingProducts || []).reduce((sum, p) => sum + ((p.price || 0) * (p.quantityOrWeight || 0)), 0);
                return (
                    <Box key={order.id} sx={{
                        mb: 4,
                        p: 2,
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        background: '#fff',
                        boxShadow: 'none',
                        maxWidth: 950,
                        mx: 'auto',
                        position: 'relative',
                    }}>
                        {/* כותרת עם פרטי ההזמנה */}
                        <Box sx={{ mb: 0, mt: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 900, fontSize: '22px', color: '#000', textAlign: 'start', mb: 1 }}>
                                הזמנה מס' {order.nbsOrderId || ''}
                            </Typography>
                            <Typography sx={{ fontWeight: 900, fontSize: '22px', color: '#000', textAlign: 'end', mb: 1 }}>
                                {order.collectionGroupOrder || ''}
                            </Typography>
                        </Box>
                        <Box sx={{ mb: 2, mt: 1 }}>
                            <Box sx={{ mb: 0, mt: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ mb: 0, mt: 1, display: 'flex', flexDirection: 'column', }}>

                                    <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#000', textAlign: 'start', mb: 0.5 }}>
                                        לקוח: {`${order.firstName || ''} ${order.lastName || ''}`.trim()}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#000', textAlign: 'start', mb: 0.5 }}>
                                        כתובת: {order.street}
                                    </Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#000', textAlign: 'start', mb: 0.5 }}>
                                        טלפונים: {order.phones ? order.phones.join(' | ') : 'לא צוינו'}
                                    </Typography>
                                </Box>
                                <Box sx={{ mt: 2, mb: 1, p: 2, background: '#f7f7f7', borderRadius: '8px', border: '1px solid #e0e0e0', maxWidth: 400, alignSelf: 'end', minHeight: 60 }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: '18px', color: '#000', mb: 1 }}>סה"כ לזיכוי</Typography>
                                    <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#000' }}>{totalCredit.toLocaleString()} ₪</Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* טבלת המוצרים החסרים */}
                        <Box sx={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            background: 'transparent',
                            boxSizing: 'border-box',
                            my: 1
                        }}>
                            <TableContainer sx={{
                                width: '100%',
                                maxWidth: 900,
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #e0e0e0',
                                background: '#fff',
                                boxShadow: 'none',
                            }}>
                                <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                                    <TableHead>
                                        <TableRow sx={{ background: '#f0f0f0', height: '32px' }}>
                                            <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', width: '60%' }}>מוצר חסר</TableCell>
                                            <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', width: '10%' }}>כמות</TableCell>
                                            <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', width: '15%' }}>מחיר</TableCell>
                                            <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', width: '15%' }}>סה"כ לזיכוי</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(order.missingProducts && order.missingProducts.length > 0) ? order.missingProducts.map((product, index) => (
                                            <TableRow key={index} sx={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff', height: '28px' }}>
                                                <TableCell sx={{ border: 'none', fontSize: '13px', textAlign: 'center', padding: '2px 4px', fontWeight: 500 }}>{product.productName}</TableCell>
                                                <TableCell sx={{ border: 'none', fontSize: '13px', textAlign: 'center', padding: '2px 4px', fontWeight: 700, width: '10%' }}>{product.quantityOrWeight}</TableCell>
                                                <TableCell sx={{ border: 'none', fontSize: '13px', textAlign: 'center', padding: '2px 4px', fontWeight: 700, width: '15%' }}>{product.price != null ? product.price.toLocaleString() : ''}</TableCell>
                                                <TableCell sx={{ border: 'none', fontSize: '13px', textAlign: 'center', padding: '2px 4px', fontWeight: 700, width: '15%' }}>{product.price != null ? (product.price * (product.quantityOrWeight || 0)).toLocaleString() : ''}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} sx={{ textAlign: 'center', fontSize: '14px', color: '#888', py: 2 }}>
                                                    אין מוצרים חסרים
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>


                    </Box>
                );
            })}

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
                color: '#888',
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 18,
            }}>
                <span>הודפס ע"י k - מערכות בהתאמה אישית kenig91255@gmail.com</span>
                <span>{currentTime} {currentDate}</span>
            </Box>
        </Box>
    );
};

export default MissingCreditsPages;
