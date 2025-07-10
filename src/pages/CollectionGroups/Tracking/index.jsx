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
    Stack,
} from "@mui/material";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import PrintIcon from "@mui/icons-material/Print";
import usePrint from "../../../context/hooks/print/usePrint";
import { useMutation, useQuery } from "react-query";
import { getCollectionGroupProductsWithOrders, getOrdersByCollectionGroup, getCollectionOrderWithProducts } from "../../../api/services/collectionGroups";
import Context from "../../../context";
import StickerPages from "./StickerPages";
import ProductPages from "./ProductPages";
import OrderPages from "./OrderPages";

const Tracking = ({ currentCollectionGroup }) => {

    const { getLookupName } = React.useContext(Context)
    const { handlePrint, printComponent } = usePrint();


    const print = useMutation(() => getCollectionGroupProductsWithOrders(currentCollectionGroup.id), {
        onSuccess: (data) => {
            console.log("Data fetched successfully:", data);

            // יצירת עמודים להדפסה - עמוד לכל מוצר (קומפוננטה חיצונית)
            const pages = ProductPages({ products: data, getLookupName });
            handlePrint(pages);
        },
        onError: (error) => {
            console.error("Error fetching data:", error);
        }
    });

    // קומפוננט הדפסה למדבקות - 8 בעמוד, כל עמוד עם אותה הזמנה
    const printStickers = useMutation(() => getOrdersByCollectionGroup(currentCollectionGroup.id), {
        onSuccess: (orders) => {
            if (!orders || orders.length === 0) {
                alert("לא נמצאו הזמנות");
                return;
            }

            console.log("Orders fetched successfully:", orders);

            const pages = StickerPages({ orders });
            handlePrint(pages);
        },
        onError: (error) => {
            alert("שגיאה בשליפת ההזמנות");
            console.error(error);
        }
    });

    // קומפוננט הדפסה לדפי הזמנה
    const printOrders = useMutation(() => getCollectionOrderWithProducts(currentCollectionGroup.id), {
        onSuccess: (orders) => {
            if (!orders || orders.length === 0) {
                alert("לא נמצאו הזמנות");
                return;
            }
            const pages = OrderPages({ orders });
            handlePrint(pages);
        },
        onError: (error) => {
            alert("שגיאה בשליפת ההזמנות");
            console.error(error);
        }
    });

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

                <Stack direction="column" spacing={2} sx={{ mt: 3, mb: 3, alignItems: 'center' }}>
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
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3 }}
                        onClick={printStickers.mutate}
                        disabled={printStickers.isLoading}
                        startIcon={printStickers.isLoading ? <CircularProgress size={20} /> : <PrintIcon />}
                    >
                        {printStickers.isLoading ? 'מכין מדבקות...' : 'הדפסת דפי מדבקות להזמנה'}
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3 }}
                        onClick={printOrders.mutate}
                        disabled={printOrders.isLoading}
                        startIcon={printOrders.isLoading ? <CircularProgress size={20} /> : <PrintIcon />}
                    >
                        {printOrders.isLoading ? 'מכין דפי הזמנה...' : 'הדפסת דפי הזמנה ללקוח'}
                    </Button>
                </Stack>

                {printComponent}
            </Paper>
        </Box>
    );
};

export default Tracking;
