import React from "react";
import {
    Box,
    Typography,
    Grid,
    Stack,
    Button,
    CircularProgress
} from "@mui/material";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import PrintIcon from "@mui/icons-material/Print";
import usePrint from "../../../context/hooks/print/usePrint";
import { useMutation, useQuery } from "react-query";
import { getCollectionGroupProductsWithOrders, getOrdersByCollectionGroup, getCollectionOrdersAndGroupProducts, getCollectionOrderWithProducts } from "../../../api/services/collectionGroups";
import OrderCard from "./OrderCard";
import Context from "../../../context";
import StickerPages from "./StickerPages";
import ProductPages from "./ProductPages";
import OrderPages from "./OrderPages";


const Tracking = ({ currentCollectionGroup }) => {
    const { getLookupName } = React.useContext(Context);
    const { handlePrint, printComponent } = usePrint();


    // עמודה 1: הזמנות עם מוצרים וסטטוס מוצר
    const { data, isLoading } = useQuery([
        "collection-orders-and-group-products",
        currentCollectionGroup?.id
    ], () => getCollectionOrdersAndGroupProducts(currentCollectionGroup.id), {
        enabled: !!currentCollectionGroup?.id
    });


    // נרמול סטטוסים לכל מוצר בכל הזמנה (MEMO)
    const orders = React.useMemo(() => {
        if (!data) return [];
        console.log("Data fetched:", data);
        const { ordersWithProducts = [], collectionGroupProducts = [] } = data;
        // מיפוי מהיר של collectionGroupProducts לפי productId
        const groupProductMap = {};
        collectionGroupProducts.forEach(p => {
            groupProductMap[p.productId] = p;
        });

        return ordersWithProducts.map(order => {
            let countOnShelf = 0, countInCart = 0, countPlaced = 0;
            const products = order.products.map(product => {
                const groupProduct = groupProductMap[product.productId];
                let status = 'onShelf';
                if (groupProduct) {
                    if (groupProduct.status === 1) {
                        status = 'onShelf';
                        countOnShelf++;
                    } else if (groupProduct.status === 2 || groupProduct.status === 3) {
                        if (product.status === 3) {
                            status = 'placed';
                            countPlaced++;
                        } else if (product.status === 2) {
                            status = 'inCart';
                            countInCart++;
                        } else {
                            status = 'inCart';
                            countInCart++;
                        }
                    } else {
                        countOnShelf++;
                    }
                } else {
                    countOnShelf++;
                }
                return {
                    ...product,
                    status
                };
            });
            return {
                ...order,
                products,
                countOnShelf,
                countInCart,
                countPlaced
            };
        });
    }, [data]);

    // עמודה 3: כל מה שהיה קודם
    const print = useMutation(() => getCollectionGroupProductsWithOrders(currentCollectionGroup.id), {
        onSuccess: (data) => {
            const pages = ProductPages({ products: data, getLookupName });
            handlePrint(pages);
        },
        onError: (error) => {
            console.error("Error fetching data:", error);
        }
    });
    const printStickers = useMutation(() => getOrdersByCollectionGroup(currentCollectionGroup.id), {
        onSuccess: (orders) => {
            if (!orders || orders.length === 0) {
                alert("לא נמצאו הזמנות");
                return;
            }
            const pages = StickerPages({ orders });
            handlePrint(pages);
        },
        onError: (error) => {
            alert("שגיאה בשליפת ההזמנות");
            console.error(error);
        }
    });
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
            <Grid container spacing={3}>
                {/* עמודה 1: הזמנות עם מוצרים */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h5" gutterBottom>הזמנות עם מוצרים</Typography>
                    {isLoading ? (
                        <CircularProgress />
                    ) : (
                        orders && orders.length > 0 ? (
                            orders.map(order => (
                                <OrderCard key={order.id} order={order} getLookupName={getLookupName} />
                            ))
                        ) : (
                            <Typography color="text.secondary">לא נמצאו הזמנות</Typography>
                        )
                    )}
                </Grid>
                {/* עמודה 2: ריק לעתיד */}
                <Grid item xs={12} md={4}>
                    {/* כאן אפשר להוסיף תוכן נוסף בהמשך */}
                </Grid>
                {/* עמודה 3: כל מה שהיה קודם */}
                <Grid item xs={12} md={4}>
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
                </Grid>
            </Grid>
        </Box>
    );
};

export default Tracking;
