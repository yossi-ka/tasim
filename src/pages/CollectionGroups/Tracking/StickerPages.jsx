import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import Inventory2Icon from '@mui/icons-material/Inventory2';
import BusinessIcon from '@mui/icons-material/Business';

/**
 * יוצר דפי מדבקות להזמנות - 8 מדבקות בעמוד, כל עמוד עם אותה הזמנה
 * @param {Array} orders - מערך ההזמנות
 * @returns JSX של עמודי המדבקות
 */
const StickerPages = ({ orders, title, amountStickers = 8 }) => {
    // מיין את ההזמנות לפי collectionGroupOrder
    const sortedOrders = [...orders].sort((a, b) => (a.collectionGroupOrder || 0) - (b.collectionGroupOrder || 0));
    // צור מערך של 8 מדבקות לכל הזמנה
    const stickers = sortedOrders.flatMap(order => Array(amountStickers).fill(order));
    // חלק לעמודים של 8
    const pages = [];
    for (let i = 0; i < stickers.length; i += 8) {
        const pageOrders = stickers.slice(i, i + 8);
        pages.push(
            <Box
                key={i}
                className="print-page"
                sx={{
                    width: "210mm",
                    height: "297mm",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gridTemplateRows: "1fr 1fr 1fr 1fr",
                    boxSizing: "border-box",
                    paddingTop: "20px",
                    paddingBottom: "20px",
                    pageBreakBefore: "always",
                    gap: 0
                }}
            >
                {pageOrders.map((order, idx) => (
                    <Box key={idx} className="table-container" sx={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        p: 0,
                        boxSizing: "border-box",
                        border: "1.5px solid #bbb",
                        padding: "10px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "#fff"
                    }}>
                        {/* מספר ההזמנה ומספר המשלוח - זה ליד זה עם קו מפריד ואייקונים */}
                        <Stack direction="row" spacing={0} sx={{ textAlign: "center", width: "100%", height: "120px", mb: 1 }}>
                            {/* חלק מספר ההזמנה עם אייקון קופסה */}
                            <Box sx={{ 
                                flex: 1, 
                                display: "flex", 
                                flexDirection: "column",
                                alignItems: "center", 
                                justifyContent: "center",
                                position: "relative",
                                overflow: "hidden"
                            }}>
                                {/* אייקון קופסה ברקע */}
                                <Inventory2Icon sx={{ 
                                    position: "absolute",
                                    fontSize: "80px",
                                    color: "#d0d0d0",
                                    zIndex: 0,
                                    opacity: 0.5
                                }} />
                                <Typography sx={{ 
                                    fontWeight: 900, 
                                    fontSize: "60px", 
                                    color: "#000", 
                                    textAlign: "center", 
                                    letterSpacing: 2, 
                                    lineHeight: 1,
                                    position: "relative",
                                    zIndex: 1
                                }}>
                                    {order.collectionGroupOrder}
                                </Typography>
                                {order.collectionGroupOrder && (
                                    <Typography sx={{ 
                                        fontSize: "14px", 
                                        color: "#666", 
                                        textAlign: "center",
                                        fontWeight: 600,
                                        mt: 0.5,
                                        position: "relative",
                                        zIndex: 1
                                    }}>
                                        קרטון
                                    </Typography>
                                )}
                            </Box>
                            
                            {/* קו מפריד */}
                            <Box sx={{ 
                                width: "2px", 
                                backgroundColor: "#ddd", 
                                alignSelf: "stretch",
                                mx: 1
                            }} />
                            
                            {/* חלק מספר המשלוח עם אייקון בניין */}
                            <Box sx={{ 
                                flex: 1, 
                                display: "flex", 
                                flexDirection: "column",
                                alignItems: "center", 
                                justifyContent: "center",
                                position: "relative",
                                overflow: "hidden"
                            }}>
                                {/* אייקון בניין ברקע */}
                                <BusinessIcon sx={{ 
                                    position: "absolute",
                                    fontSize: "80px",
                                    color: "#d0d0d0",
                                    zIndex: 0,
                                    opacity: 0.5
                                }} />
                                <Typography sx={{ 
                                    fontWeight: 900, 
                                    fontSize: "60px", 
                                    color: "#000", 
                                    textAlign: "center", 
                                    letterSpacing: 2, 
                                    lineHeight: 1,
                                    position: "relative",
                                    zIndex: 1
                                }}>
                                    {order.deliveryIndex}
                                </Typography>
                                {order.deliveryIndex && (
                                    <Typography sx={{ 
                                        fontSize: "14px", 
                                        color: "#666", 
                                        textAlign: "center",
                                        fontWeight: 600,
                                        mt: 0.5,
                                        position: "relative",
                                        zIndex: 1
                                    }}>
                                        בנין
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                        <Box sx={{ width: "60%", borderBottom: "2px solid #000", mb: 1 }} />
                        {/* שם הלקוח */}
                        <Typography sx={{ fontWeight: 700, fontSize: "18px", color: "#888", textAlign: "center", mb: 0.5, letterSpacing: 0.5 }}>
                            {`${order.firstName || ''} ${order.lastName || ''}`.trim()}
                        </Typography>
                        {/* כתובת */}
                        <Typography sx={{ fontSize: "12px", color: "#000", textAlign: "center", mb: 0.5 }}>
                            {order.street}
                        </Typography>
                        <Typography sx={{ fontSize: "12px", color: "#000", textAlign: "center", mb: 0.5 }}>
                            {order.phones ? order.phones.join(" | ") : ""}
                        </Typography>
                        {/* מספר המדבקה בפינה */}
                        <Typography sx={{ position: "absolute", left: 12, bottom: 10, fontSize: "13px", color: "#000", fontWeight: 700, opacity: 0.7 }}>
                            {idx + 1}
                        </Typography>
                        {title && <Typography sx={{ position: "absolute", right: 12, bottom: 10, fontSize: "13px", color: "#000", fontWeight: 700, opacity: 0.7 }}>
                            {title}
                        </Typography>}
                    </Box>
                ))}
                {/* placeholders אם חסר */}
                {Array(8 - pageOrders.length).fill(0).map((_, j) => (
                    <Box key={"ph-" + j} className="table-container placeholder" sx={{ border: "none" }} />
                ))}
            </Box>
        );
    }
    return pages;
};

export default StickerPages;
