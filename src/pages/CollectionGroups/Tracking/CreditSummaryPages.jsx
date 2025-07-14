import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

const CreditSummaryPages = ({ orders }) => {
    const now = new Date();
    const currentDate = now.toLocaleDateString('he-IL');
    const currentTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // סינון הזמנות עם זיכויים בלבד
    const ordersWithCredits = orders.filter(order => {
        const orderCredit = (order.missingProducts || []).reduce((orderSum, p) => 
            orderSum + ((p.price || 0) * (p.quantityOrWeight || 0)), 0);
        return orderCredit > 0;
    });

    // חישוב סה"כ זיכוי כללי
    const totalCreditAll = ordersWithCredits.reduce((sum, order) => {
        const orderCredit = (order.missingProducts || []).reduce((orderSum, p) => 
            orderSum + ((p.price || 0) * (p.quantityOrWeight || 0)), 0);
        return sum + orderCredit;
    }, 0);

    // חלוקה לעמודים - 10 רשומות לעמוד
    const recordsPerPage = 10;
    const totalPages = Math.ceil(ordersWithCredits.length / recordsPerPage);
    
    const pages = [];
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const pageOrders = ordersWithCredits.slice(pageIndex * recordsPerPage, (pageIndex + 1) * recordsPerPage);
        
        pages.push(
            <Box key={pageIndex} sx={{
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

                <Typography sx={{ fontWeight: 900, fontSize: '32px', color: '#000', textAlign: 'center', mb: 3 }}>
                    דוח זיכויים מסוכם ללקוחות
                </Typography>

                {/* מידע עמוד אם יש יותר מעמוד אחד */}
                {totalPages > 1 && (
                    <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#666' }}>
                            עמוד {pageIndex + 1} מתוך {totalPages}
                        </Typography>
                    </Box>
                )}

                {/* סיכום כללי רק בעמוד הראשון */}
                {pageIndex === 0 && (
                    <Box sx={{ 
                        mb: 3, 
                        p: 2, 
                        background: '#f0f8ff', 
                        borderRadius: '8px', 
                        border: '2px solid #1976d2',
                        textAlign: 'center'
                    }}>
                        <Typography sx={{ fontWeight: 900, fontSize: '20px', color: '#1976d2', mb: 1 }}>
                            סה"כ זיכויים לכל הלקוחות
                        </Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: '24px', color: '#000' }}>
                            {totalCreditAll.toLocaleString()} ₪
                        </Typography>
                    </Box>
                )}

                {/* טבלת סיכום לקוחות */}
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
                        maxWidth: 950,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid #e0e0e0',
                        background: '#fff',
                        boxShadow: 'none',
                    }}>
                        <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                            <TableHead>
                                <TableRow sx={{ background: '#f0f0f0', height: '40px' }}>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '15px', color: '#222', textAlign: 'center', padding: '8px', width: '12%' }}>מס' הזמנה</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '15px', color: '#222', textAlign: 'center', padding: '8px', width: '13%' }}>מס' בקבוצה</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '15px', color: '#222', textAlign: 'center', padding: '8px', width: '25%' }}>שם הלקוח</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '15px', color: '#222', textAlign: 'center', padding: '8px', width: '30%' }}>כתובת</TableCell>
                                    <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '15px', color: '#222', textAlign: 'center', padding: '8px', width: '20%' }}>סכום לזיכוי</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pageOrders.map((order, index) => {
                                    const totalCredit = (order.missingProducts || []).reduce((sum, p) => 
                                        sum + ((p.price || 0) * (p.quantityOrWeight || 0)), 0);
                                    
                                    return (
                                        <TableRow key={order.id} sx={{ 
                                            backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff', 
                                            height: '36px'
                                        }}>
                                            <TableCell sx={{ border: 'none', fontSize: '14px', textAlign: 'center', padding: '6px 8px', fontWeight: 600 }}>
                                                {order.nbsOrderId || '—'}
                                            </TableCell>
                                            <TableCell sx={{ border: 'none', fontSize: '14px', textAlign: 'center', padding: '6px 8px', fontWeight: 600 }}>
                                                {order.collectionGroupOrder || '—'}
                                            </TableCell>
                                            <TableCell sx={{ border: 'none', fontSize: '14px', textAlign: 'center', padding: '6px 8px', fontWeight: 500 }}>
                                                {`${order.firstName || ''} ${order.lastName || ''}`.trim() || '—'}
                                            </TableCell>
                                            <TableCell sx={{ border: 'none', fontSize: '14px', textAlign: 'center', padding: '6px 8px', fontWeight: 500 }}>
                                                {order.street || '—'}
                                            </TableCell>
                                            <TableCell sx={{ 
                                                border: 'none', 
                                                fontSize: '16px', 
                                                textAlign: 'center', 
                                                padding: '6px 8px', 
                                                fontWeight: 700
                                            }}>
                                                {totalCredit.toLocaleString()} ₪
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                                
                                {/* שורת סיכום רק בעמוד האחרון */}
                                {pageIndex === totalPages - 1 && (
                                    <TableRow sx={{ 
                                        backgroundColor: '#e3f2fd', 
                                        height: '44px',
                                        borderTop: '2px solid #1976d2'
                                    }}>
                                        <TableCell colSpan={4} sx={{ 
                                            border: 'none', 
                                            fontSize: '18px', 
                                            textAlign: 'center', 
                                            padding: '8px', 
                                            fontWeight: 900,
                                            color: '#1976d2'
                                        }}>
                                            סה"כ זיכויים
                                        </TableCell>
                                        <TableCell sx={{ 
                                            border: 'none', 
                                            fontSize: '20px', 
                                            textAlign: 'center', 
                                            padding: '8px', 
                                            fontWeight: 900
                                        }}>
                                            {totalCreditAll.toLocaleString()} ₪
                                        </TableCell>
                                    </TableRow>
                                )}
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
    }
    
    return pages;
};

export default CreditSummaryPages;
