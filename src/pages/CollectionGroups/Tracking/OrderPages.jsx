import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";

/**
 * קומפוננטת עמוד הדפסה להזמנה בודדת
 */
export const OrderPrintComponent = ({ order, currentPage, totalPages, pageIndex, pageCount }) => {
    const now = new Date();
    const currentDate = now.toLocaleDateString('he-IL');
    const currentTime = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // חישוב סה"כ עמודים להזמנה זו
    const products = order.products || [];
    // חישוב זיכוי ומוצרים חסרים - על בסיס כל המוצרים של ההזמנה המקורית
    const allOrderProducts = order.originalProducts || order.products || [];

    const { totalMissingCount, totalCredit } = allOrderProducts.reduce((acc, p) => {
        const missQ = p.status === 4 ? (p.quantityOrWeight || 0) : (p.qtyMissing || 0);
        acc.totalMissingCount += missQ;
        acc.totalCredit += (p.price || 0) * (missQ || 0);
        return acc;
    }, { totalMissingCount: 0, totalCredit: 0 });

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

            {/* כותרת עם פרטי ההזמנה */}
            <Box sx={{ mb: 0, mt: 1, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontWeight: 900, fontSize: '30px', color: '#000', textAlign: 'start', mb: 1 }}>
                    הזמנה מס' {order.nbsOrderId || ''}
                </Typography>
                <Typography sx={{ fontWeight: 900, fontSize: '30px', color: '#000', textAlign: 'end', mb: 1 }}>
                    {order.collectionGroupOrder || ''}
                </Typography>
            </Box>
            <Box sx={{ mb: 2, mt: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '18px', color: '#000', textAlign: 'start', mb: 0.5 }}>
                    לקוח: {`${order.firstName || ''} ${order.lastName || ''}`.trim()}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '18px', color: '#000', textAlign: 'start', mb: 0.5 }}>
                    כתובת: {order.street}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '18px', color: '#000', textAlign: 'start', mb: 0.5 }}>
                    טלפונים: {order.phones ? order.phones.join(' | ') : 'לא צוינו'}
                </Typography>
            </Box>

            {totalPages > 1 && (
                <Box sx={{ mb: 1, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '20px', color: '#000', background: '#eee', borderRadius: '8px', px: 2, py: 0.5, display: 'inline-block' }}>
                        עמוד {currentPage} מתוך {totalPages}
                    </Typography>
                </Box>
            )}

            {/* טבלת המוצרים */}
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
                                <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', width: '60%' }}>מוצר</TableCell>
                                <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', width: '10%' }}>כמות</TableCell>
                                <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', width: '15%' }}>מחיר</TableCell>
                                <TableCell sx={{ border: 'none', fontWeight: 700, fontSize: '13px', color: '#222', textAlign: 'center', padding: '4px', width: '15%' }}>סה"כ</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product, index) => {
                                const isCredited = product.status === 4 || product.miss == product.quantityOrWeight;

                                return (
                                    <TableRow
                                        key={index}
                                        sx={{
                                            backgroundColor: isCredited ? '#e0e0e0' : (index % 2 === 0 ? '#fafafa' : '#fff'),
                                            height: '28px',
                                        }}
                                    >
                                        <TableCell sx={{ border: 'none', fontSize: '13px', textAlign: 'center', padding: '2px 4px', fontWeight: 500 }}>
                                            {product.productName}
                                            {isCredited && (
                                                <Chip
                                                    label={`חסר  ${totalMissingCount} יחידות בהזמנה - בוצע זיכוי`}
                                                    size="small"
                                                    sx={{
                                                        ml: 1,
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        background: '#bdbdbd',
                                                        color: '#222',
                                                        height: 20,
                                                        borderRadius: '8px',
                                                        verticalAlign: 'middle',
                                                        px: 1.2,
                                                        display: 'inline-flex',
                                                    }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ border: 'none', fontSize: '13px', textAlign: 'center', padding: '2px 4px', fontWeight: 700, width: '10%' }}>{product.quantityOrWeight}</TableCell>
                                        <TableCell sx={{ border: 'none', fontSize: '13px', textAlign: 'center', padding: '2px 4px', fontWeight: 700, width: '15%' }}>{product.price != null ? product.price.toLocaleString() : ''}</TableCell>
                                        <TableCell sx={{ border: 'none', fontSize: '13px', textAlign: 'center', padding: '2px 4px', fontWeight: 700, width: '15%' }}>{product.price != null ? (product.price * (product.quantityOrWeight || 0)).toLocaleString() : ''}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* סיכום הזמנה */}
            {totalPages === currentPage && (
                <Box sx={{ mt: 2, mb: 1, p: 2, background: '#f7f7f7', borderRadius: '8px', border: '1px solid #e0e0e0', maxWidth: 400, alignSelf: 'end', minHeight: 120 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: '18px', color: '#000', mb: 1 }}>סיכום הזמנה</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#000' }}>סה"כ שולם: {order.totalPrice.toLocaleString()} ₪</Typography>
                    {totalCredit > 0 && (
                        <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#000', mt: 0.5 }}>
                            סה"כ זיכוי עבור מוצרים חסרים: {totalCredit.toLocaleString()} ₪
                        </Typography>
                    )}
                    <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#000' }}>אמצעי תשלום: {order.paymentMethod || '—'}</Typography>
                    {order.moreInfo && (
                        <Typography sx={{ fontWeight: 700, fontSize: '16px', color: '#000' }}>מידע נוסף: {order.moreInfo}</Typography>
                    )}
                </Box>
            )}

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
                // מרווח מהשוליים התחתונים
            }}>
                <span>הודפס ע"י k - מערכות בהתאמה אישית kenig91255@gmail.com</span>
                <span>{currentTime} {currentDate}</span>
            </Box>
        </Box>
    );
};

const OrderPages = ({ orders }) => {
    // עבור כל הזמנה, צור עמודים לפי 25 מוצרים לעמוד
    const pages = [];
    orders.forEach((order) => {
        const products = order.products || [];
        const productsPerPage = 20;
        const totalPagesForOrder = Math.ceil(products.length / productsPerPage) || 1;
        // אל תיצור עמודים אם אין מוצרים להזמנה
        if (products.length === 0) return;
        for (let pageIndex = 0; pageIndex < totalPagesForOrder; pageIndex++) {
            const pageProducts = products.slice(pageIndex * productsPerPage, (pageIndex + 1) * productsPerPage);
            // דלג על עמודים ריקים (למקרה של באג בנתונים)
            if (!pageProducts.length) continue;
            pages.push(
                <OrderPrintComponent
                    key={order.id + '-' + pageIndex}
                    order={{ ...order, products: pageProducts, originalProducts: products }}
                    currentPage={pageIndex + 1}
                    totalPages={totalPagesForOrder}
                    pageIndex={pageIndex}
                    pageCount={totalPagesForOrder}
                />
            );
        }
    });
    return pages;
};

export default OrderPages;
