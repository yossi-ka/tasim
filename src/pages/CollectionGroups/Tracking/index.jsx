import React from "react";
import {
    Box,
    Typography,
    Grid,
    Stack,
    Button,
    CircularProgress,
    ToggleButtonGroup,
    ToggleButton
} from "@mui/material";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import PrintIcon from "@mui/icons-material/Print";
import usePrint from "../../../context/hooks/print/usePrint";
import { useMutation, useQuery } from "react-query";
import { getCollectionGroupProductsWithOrders, getOrdersByCollectionGroup, getCollectionOrdersAndGroupProducts, getCollectionOrderWithProducts, getProductsWithOrdersAndStatusSummary, getMissingProductsByOrder } from "../../../api/services/collectionGroups";
import OrderCard from "./OrderCard";
import ProductCard from "./ProductCard";
import Context from "../../../context";
import StickerPages from "./StickerPages";
import ProductPages from "./ProductPages";
import OrderPages from "./OrderPages";
import MissingCreditsPages from "./MissingCreditsPages";


const Tracking = ({ currentCollectionGroup }) => {
    const { getLookupName } = React.useContext(Context);
    const { handlePrint, printComponent } = usePrint();

    const [filterOrdersType, setFilterOrdersType] = React.useState("all");
    // עמודה 1: הזמנות עם מוצרים וסטטוס מוצר
    const { data, isLoading, refetch } = useQuery([
        "collection-orders-and-group-products",
        currentCollectionGroup?.id
    ], () => getCollectionOrdersAndGroupProducts(currentCollectionGroup.id), {
        enabled: !!currentCollectionGroup?.id
    });

    const filteredOrders = React.useMemo(() => {
        if (!data) return [];
        return data.filter(order => {
            if (filterOrdersType === "ready") {
                return order.countStatus2 === 0 && order.countStatus5 === 0 && order.countStatus3 > 0;
            } else if (filterOrdersType === "notReady") {
                return order.countStatus2 > 0 || order.countStatus5 > 0;
            } else if (filterOrdersType === "missing") {
                return order.countStatus4 > 0;
            }
            return true; // הכל
        });
    }, [data, filterOrdersType]);


    const [filterProductsType, setFilterProductsType] = React.useState("all");
    // עמודה 1: הזמנות עם מוצרים וסטטוס מוצר
    const productsCollection = useQuery([
        "collection-products-and-group-orders",
        currentCollectionGroup?.id
    ], () => getProductsWithOrdersAndStatusSummary(currentCollectionGroup.id), {
        enabled: !!currentCollectionGroup?.id
    });

    const filteredProducts = React.useMemo(() => {
        if (!productsCollection.data) return [];
        return productsCollection.data.filter(product => {
            if (filterProductsType === "ready") {
                return (product?.status2 === 0) && (product?.status5 === 0) && (product?.status3 > 0);
            } else if (filterProductsType === "notReady") {
                return (product?.status2 > 0);
            } else if (filterProductsType === "missing") {
                return (product?.status4 > 0);
            }
            return true;
        });
    }, [productsCollection.data, filterProductsType]);

    console.log("productsCollection", productsCollection.data);
    console.log("data", data);

    const refetchAll = () => {
        refetch();
        productsCollection.refetch();
    }

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

    const printMissingOrders = useMutation(() => getMissingProductsByOrder(currentCollectionGroup.id), {
        onSuccess: (orders) => {
            if (!orders || orders.length === 0) {
                alert("לא נמצאו הזמנות");
                return;
            }
            const pages = MissingCreditsPages({ orders });
            handlePrint([pages]);
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
                <Grid item xs={12} md={4} sx={{}}>
                    <Typography variant="h5" textAlign="center">הזמנות עם מוצרים</Typography>
                    <ToggleButtonGroup
                        value={filterOrdersType}
                        onChange={(_, newFilters) => {
                            setFilterOrdersType(newFilters);

                        }}
                        color="primary"
                        size="small"
                        exclusive
                    >
                        <ToggleButton value="ready" aria-label="ready">
                            מוכן
                        </ToggleButton>
                        <ToggleButton value="notReady" aria-label="notReady">
                            לא מוכן
                        </ToggleButton>
                        <ToggleButton value="missing" aria-label="missing">
                            מוצרים חסרים
                        </ToggleButton>
                        <ToggleButton value="all" aria-label="all">
                            הכל
                        </ToggleButton>

                    </ToggleButtonGroup>
                    <Box sx={{ mb: 2, height: '62vh', overflowY: 'auto' }}>
                        {isLoading ? (
                            <CircularProgress />
                        ) : (
                            filteredOrders.length > 0 ? (
                                filteredOrders.map(order => (
                                    <OrderCard key={order.id} order={order} refetch={refetchAll} />
                                ))
                            ) : (
                                <Typography textAlign="center" variant="h4" color="text.secondary" sx={{ my: 10 }}>לא נמצאו הזמנות</Typography>
                            )
                        )}
                    </Box>
                </Grid>
                {/* עמודה 2: מוצרים עם הזמנות */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h5" textAlign="center">מוצרים עם הזמנות</Typography>
                    <ToggleButtonGroup
                        value={filterProductsType}
                        onChange={(_, newFilters) => {
                            setFilterProductsType(newFilters);
                        }}
                        color="primary"
                        size="small"
                        exclusive
                    >
                        <ToggleButton value="ready" aria-label="ready">
                            הסתיים
                        </ToggleButton>
                        <ToggleButton value="notReady" aria-label="notReady">
                            לא הסתיים
                        </ToggleButton>
                        <ToggleButton value="missing" aria-label="missing">
                            מוצרים חסרים
                        </ToggleButton>
                        <ToggleButton value="all" aria-label="all">
                            הכל
                        </ToggleButton>
                    </ToggleButtonGroup>
                    <Box sx={{ mb: 2, height: '62vh', overflowY: 'auto' }}>
                        {productsCollection.isLoading ? (
                            <CircularProgress />
                        ) : (
                            filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} refetch={refetchAll} />
                                ))
                            ) : (
                                <Typography textAlign="center" variant="h4" color="text.secondary" sx={{ my: 10 }}>לא נמצאו מוצרים</Typography>
                            )
                        )}
                    </Box>
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
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ mt: 3 }}
                            onClick={printMissingOrders.mutate}
                            disabled={printMissingOrders.isLoading}
                            startIcon={printMissingOrders.isLoading ? <CircularProgress size={20} /> : <PrintIcon />}
                        >
                            {printMissingOrders.isLoading ? 'מכין דוח זיכויים...' : 'הדפסת דוח זיכויים'}
                        </Button>
                    </Stack>
                    {printComponent}
                </Grid>
            </Grid>
        </Box>
    );
};

export default Tracking;
