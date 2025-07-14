import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * יוצר דפי מדבקות להזמנות - 8 מדבקות בעמוד, כל עמוד עם אותה הזמנה
 * @param {Array} orders - מערך ההזמנות
 * @returns JSX של עמודי המדבקות
 */
const StickerPages = ({ orders, title }) => {
    // מיין את ההזמנות לפי collectionGroupOrder
    const sortedOrders = [...orders].sort((a, b) => (a.collectionGroupOrder || 0) - (b.collectionGroupOrder || 0));
    // צור מערך של 8 מדבקות לכל הזמנה
    const stickers = sortedOrders.flatMap(order => Array(8).fill(order));
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
                        {/* מספר ההזמנה - גדול מאוד, מודגש, עם קו תחתון */}
                        <Typography sx={{ fontWeight: 900, fontSize: "100px", color: "#000", textAlign: "center", mb: 1, letterSpacing: 2, lineHeight: 1 }}>
                            {order.collectionGroupOrder}
                        </Typography>
                        <Box sx={{ width: "60%", borderBottom: "2px solid #000", mb: 1 }} />
                        {/* שם הלקוח */}
                        <Typography sx={{ fontWeight: 700, fontSize: "18px", color: "#888", textAlign: "center", mb: 0.5, letterSpacing: 0.5 }}>
                            {`${order.firstName || ''} ${order.lastName || ''}`.trim()}
                        </Typography>
                        {/* כתובת */}
                        <Typography sx={{ fontSize: "15px", color: "#000", textAlign: "center", mb: 0.5 }}>
                            {order.street}
                        </Typography>
                        {/* מספר המדבקה בפינה */}
                        <Typography sx={{ position: "absolute", left: 12, bottom: 10, fontSize: "13px", color: "#000", fontWeight: 700, opacity: 0.7 }}>
                            {idx + 1}
                        </Typography>
                        {/* מספר המדבקה בפינה */}
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
