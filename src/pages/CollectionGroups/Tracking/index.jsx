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
import { getCollectionGroupProductsWithOrders, getOrdersByCollectionGroup, getCollectionOrdersAndGroupProducts, getCollectionOrderWithProducts, getProductsWithOrdersAndStatusSummary, getMissingProductsByOrder, getProductsWithStatusSummaryOnly, getOrdersByProductCategory } from "../../../api/services/collectionGroups";
import OrderCard from "./OrderCard";
import ProductCard from "./ProductCard";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Context from "../../../context";
import StickerPages from "./StickerPages";
import ProductPages from "./ProductPages";
import OrderPages from "./OrderPages";
import MissingCreditsPages from "./MissingCreditsPages";
import CreditSummaryPages from "./CreditSummaryPages";


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


    // Query לגרף הסטטוסים
    const statusSummaryQuery = useQuery([
        "status-summary",
        currentCollectionGroup?.id
    ], () => getProductsWithStatusSummaryOnly(currentCollectionGroup.id), {
        enabled: !!currentCollectionGroup?.id
    });

    const chartData = React.useMemo(() => {
        if (!statusSummaryQuery.data) return [];

        const totals = statusSummaryQuery.data;

        return [
            { name: 'על המדף', value: totals.status2 || 0, color: "#bfbfbf" },
            { name: 'בעגלה', value: totals.status5 || 0, color: "#faad14" },
            { name: 'הושלם', value: totals.status3 || 0, color: "#52c41a" },
            { name: 'חסר', value: totals.status4 || 0, color: "#f5222d" },
        ].filter(item => item.value > 0);
    }, [statusSummaryQuery.data]);

    const totalItems = chartData.reduce((sum, item) => sum + item.value, 0);

    const refetchAll = () => {
        refetch();
        productsCollection.refetch();
        statusSummaryQuery.refetch();
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
    const printCategoryStickers = useMutation((category) => getOrdersByProductCategory(currentCollectionGroup.id, category), {
        onSuccess: (orders, category) => {
            if (!orders || orders.length === 0) {
                alert("לא נמצאו הזמנות");
                return;
            }
            console.log(orders)
            const title = getLookupName("globalProductCategories", category);
            const pages = StickerPages({ orders, title, amountStickers: 1 });
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
            console.log(orders);
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

    const printCreditSummary = useMutation(() => getMissingProductsByOrder(currentCollectionGroup.id), {
        onSuccess: (orders) => {
            if (!orders || orders.length === 0) {
                alert("לא נמצאו הזמנות");
                return;
            }
            const pages = CreditSummaryPages({ orders });

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
                <Grid item xs={12} md={4} sx={{
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: -12,
                        bottom: 0,
                        width: '1px',
                        backgroundColor: '#e0e0e0',
                        display: { xs: 'none', md: 'block' }
                    }
                }}>
                    <Typography variant="h5" textAlign="center">הזמנות עם מוצרים - <strong>{filteredOrders.length}</strong></Typography>
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
                <Grid item xs={12} md={4} sx={{
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: -12,
                        bottom: 0,
                        width: '1px',
                        backgroundColor: '#e0e0e0',
                        display: { xs: 'none', md: 'block' }
                    }
                }}>
                    <Typography variant="h5" textAlign="center">מוצרים עם הזמנות - <strong>{filteredProducts.length}</strong></Typography>
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
                {/* עמודה 3: גרף סטטוסים */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h5" gutterBottom textAlign="center">
                        סיכום סטטוסים
                    </Typography>

                    {statusSummaryQuery.isLoading ? (
                        <Box display="flex" justifyContent="center" mt={4}>
                            <CircularProgress />
                        </Box>
                    ) : chartData.length > 0 ? (
                        <Box>
                            {/* גרף עוגה */}
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} פריטים`, 'כמות']} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* סיכום במספרים */}
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="h6" textAlign="center" gutterBottom>
                                    סה"כ: {totalItems} פריטים
                                </Typography>
                                <Stack spacing={1}>
                                    {chartData.map((item, index) => (
                                        <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                                            <Box display="flex" alignItems="center">
                                                <Box
                                                    sx={{
                                                        width: 16,
                                                        height: 16,
                                                        backgroundColor: item.color,
                                                        borderRadius: '50%',
                                                        mr: 1
                                                    }}
                                                />
                                                <Typography variant="body2">{item.name}</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {item.value} ({Math.round((item.value / totalItems) * 100)}%)
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Box>
                    ) : (
                        <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
                            אין נתונים להצגה
                        </Typography>
                    )}

                    {/* אזור הדפסות */}
                    <Box sx={{
                        mt: 4,
                        p: 4,
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        borderRadius: 4,
                        border: '1px solid #dee2e6',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                    }}>
                        <Typography variant="h6" textAlign="center" sx={{
                            mb: 4,
                            color: '#2c3e50',
                            fontWeight: 600,
                            fontSize: '1.1rem'
                        }}>
                            <PrintIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#3498db' }} />
                            הדפסת דוחות
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={printStickers.mutate}
                                    disabled={printStickers.isLoading}
                                    startIcon={printStickers.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PrintIcon />}
                                    sx={{
                                        height: 56,
                                        backgroundColor: '#3498db',
                                        borderRadius: 3,
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#2980b9',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#bdc3c7',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {printStickers.isLoading ? 'מכין מדבקות...' : 'דפי מדבקות להזמנה'}
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => printCategoryStickers.mutate("EMqF46IO87uoCUKEXgpT")}
                                    disabled={printCategoryStickers.isLoading}
                                    startIcon={printCategoryStickers.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PrintIcon />}
                                    sx={{
                                        height: 56,
                                        backgroundColor: '#27ae60',
                                        borderRadius: 3,
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        boxShadow: '0 2px 8px rgba(39, 174, 96, 0.3)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#229954',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(39, 174, 96, 0.4)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#bdc3c7',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {printCategoryStickers.isLoading ? 'מכין מדבקות...' : 'דפי מדבקות לחלבי'}
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => printCategoryStickers.mutate("JsP3G6mja3K5dpzAeqqS")}
                                    disabled={printCategoryStickers.isLoading}
                                    startIcon={printCategoryStickers.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PrintIcon />}
                                    sx={{
                                        height: 56,
                                        backgroundColor: '#2196f3',
                                        borderRadius: 3,
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#1976d2',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#bdc3c7',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {printCategoryStickers.isLoading ? 'מכין מדבקות...' : 'דפי מדבקות לקפואים'}
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={print.mutate}
                                    disabled={print.isLoading}
                                    startIcon={print.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PrintIcon />}
                                    sx={{
                                        height: 56,
                                        backgroundColor: '#8e44ad',
                                        borderRadius: 3,
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        boxShadow: '0 2px 8px rgba(142, 68, 173, 0.3)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#7d3c98',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(142, 68, 173, 0.4)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#bdc3c7',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {print.isLoading ? 'מכין דוח...' : 'דוח מוצרים להזמנה'}
                                </Button>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={printOrders.mutate}
                                    disabled={printOrders.isLoading}
                                    startIcon={printOrders.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PrintIcon />}
                                    sx={{
                                        height: 56,
                                        backgroundColor: '#e67e22',
                                        borderRadius: 3,
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        boxShadow: '0 2px 8px rgba(230, 126, 34, 0.3)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#d35400',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(230, 126, 34, 0.4)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#bdc3c7',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {printOrders.isLoading ? 'מכין דפי הזמנה...' : 'דפי הזמנה ללקוח'}
                                </Button>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={printMissingOrders.mutate}
                                    disabled={printMissingOrders.isLoading}
                                    startIcon={printMissingOrders.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PrintIcon />}
                                    sx={{
                                        height: 56,
                                        backgroundColor: '#e74c3c',
                                        borderRadius: 3,
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#c0392b',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(231, 76, 60, 0.4)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#bdc3c7',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {printMissingOrders.isLoading ? 'מכין דוח זיכויים...' : 'דוח זיכויים מפורט'}
                                </Button>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={printCreditSummary.mutate}
                                    disabled={printCreditSummary.isLoading}
                                    startIcon={printCreditSummary.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <PrintIcon />}
                                    sx={{
                                        height: 56,
                                        backgroundColor: '#34495e',
                                        borderRadius: 3,
                                        fontSize: '0.9rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        boxShadow: '0 2px 8px rgba(52, 73, 94, 0.3)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            backgroundColor: '#2c3e50',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(52, 73, 94, 0.4)'
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#bdc3c7',
                                            transform: 'none'
                                        }
                                    }}
                                >
                                    {printCreditSummary.isLoading ? 'מכין סיכום זיכויים...' : 'סיכום זיכויים'}
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                    {printComponent}
                </Grid>
            </Grid>
        </Box>
    );
};

export default Tracking;
