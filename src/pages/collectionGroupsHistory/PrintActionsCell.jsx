import React from 'react';
import { IconButton, Stack, Tooltip, CircularProgress, Box, Button } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PrintIcon from '@mui/icons-material/Print';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentIcon from '@mui/icons-material/Payment';
import PhoneIcon from '@mui/icons-material/Phone';
import { useMutation } from 'react-query';
import usePrint from '../../context/hooks/print/usePrint';
import Context from '../../context';
import {
    getCollectionGroupProductsWithOrders,
    getOrdersByCollectionGroup,
    getOrdersByProductCategory,
    getCollectionOrderWithProducts,
    getMissingProductsByOrder,
    sendTzintukForMissingOrders
} from '../../api/services/collectionGroups';
import ProductPages from '../CollectionGroups/Tracking/ProductPages';
import StickerPages from '../CollectionGroups/Tracking/StickerPages';
import OrderPages from '../CollectionGroups/Tracking/OrderPages';
import MissingCreditsPages from '../CollectionGroups/Tracking/MissingCreditsPages';
import CreditSummaryPages from '../CollectionGroups/Tracking/CreditSummaryPages';
import MissingProductsCredit from './MissingProductsCredit';


const PrintActionsCell = ({ collectionGroupId, isMissingSendTzintuk }) => {

    const { getLookupName, popup, user } = React.useContext(Context);

    const { handlePrint, printComponent } = usePrint()

    const printProducts = useMutation(() => getCollectionGroupProductsWithOrders(collectionGroupId), {
        onSuccess: (data) => {
            const pages = ProductPages({ products: data, getLookupName });
            handlePrint(pages);
        },
        onError: (error) => {
            console.error("Error fetching data:", error);
        }
    });
    const printStickers = useMutation(() => getOrdersByCollectionGroup(collectionGroupId), {
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
    const printCategoryStickers = useMutation((category) => getOrdersByProductCategory(collectionGroupId, category), {
        onSuccess: (orders, category) => {
            if (!orders || orders.length === 0) {
                alert("לא נמצאו הזמנות");
                return;
            }
            console.log(orders)
            const title = getLookupName("globalProductCategories", category);
            const pages = StickerPages({ orders, title });
            handlePrint(pages);
        },
        onError: (error) => {
            alert("שגיאה בשליפת ההזמנות");
            console.error(error);
        }
    });
    const printOrders = useMutation(() => getCollectionOrderWithProducts(collectionGroupId), {
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

    const printMissingOrders = useMutation(() => getMissingProductsByOrder(collectionGroupId), {
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

    const printCreditSummary = useMutation(() => getMissingProductsByOrder(collectionGroupId), {
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

    const sendTzintuk = useMutation(() => {
        if (isMissingSendTzintuk) {
            return alert("צינתוק חוסרים כבר בוצע");
        } else {
            const c = window.confirm("האם אתה בטוח שאתה רוצה לבצע צינתוק חוסרים?\n פעולה זו תשלח הודעה למשפחות עם פרטי החוסרים.");
            if (c) {
                sendTzintukForMissingOrders(collectionGroupId, user.id);
            }
        }
    });
    const actions = [
        {
            key: 'stickers',
            tooltip: 'מדבקות להזמנה',
            icon: <LocalOfferIcon fontSize="small" />,
            onClick: () => printStickers.mutate(),
            loading: printStickers.isLoading,
            color: '#3498db'
        },
        {
            key: 'products',
            tooltip: 'דוח מוצרים',
            icon: <PrintIcon fontSize="small" />,
            onClick: () => printProducts.mutate(),
            loading: printProducts.isLoading,
            color: '#8e44ad'
        },
        {
            key: 'orders',
            tooltip: 'דפי הזמנה',
            icon: <ShoppingCartIcon fontSize="small" />,
            onClick: () => printOrders.mutate(),
            loading: printOrders.isLoading,
            color: '#e67e22'
        },
        {
            key: 'missing',
            tooltip: 'זיכויים מפורט',
            icon: <CreditCardIcon fontSize="small" />,
            onClick: () => printMissingOrders.mutate(),
            loading: printMissingOrders.isLoading,
            color: '#e74c3c'
        },
        {
            key: 'summary',
            tooltip: 'סיכום זיכויים',
            icon: <SummarizeIcon fontSize="small" />,
            onClick: () => printCreditSummary.mutate(),
            loading: printCreditSummary.isLoading,
            color: '#34495e'
        },
        {
            key: 'dairy',
            tooltip: 'מדבקות חלבי',
            icon: <ReceiptIcon fontSize="small" />,
            onClick: () => printCategoryStickers.mutate("EMqF46IO87uoCUKEXgpT"),
            loading: printCategoryStickers.isLoading,
            color: '#27ae60'
        }
    ];

    return (
        <Box sx={{ display: 'inline-block' }}>
            <Stack direction="row" spacing={1} sx={{ width: 'fit-content', alignItems: 'center' }}>
                {/* מסגרת הדפסות */}
                <Box sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 0.5,
                    position: 'relative'
                }}>
                    <Box sx={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'background.paper',
                        px: 0.5,
                        fontSize: '0.65rem',
                        color: 'primary.dark',
                        borderRadius: 1
                    }}>
                        הדפסות
                    </Box>
                    <Stack direction="row" spacing={1}>
                        {actions.map((action) => (
                            <Tooltip key={action.key} title={action.tooltip} arrow>
                                <IconButton
                                    size="small"
                                    onClick={action.onClick}
                                    disabled={action.loading}
                                    sx={{
                                        color: action.color,
                                        width: 28,
                                        height: 28,
                                        '&:hover': {
                                            backgroundColor: `${action.color}20`,
                                            transform: 'scale(1.05)'
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {action.loading ? (
                                        <CircularProgress size={14} sx={{ color: action.color }} />
                                    ) : (
                                        action.icon
                                    )}
                                </IconButton>
                            </Tooltip>
                        ))}
                    </Stack>
                </Box>

                {/* מסגרת פעולות */}
                <Box sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    p: 0.5,
                    position: 'relative'
                }}>
                    <Box sx={{
                        position: 'absolute',
                        top: -10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'background.paper',
                        px: 0.5,
                        fontSize: '0.65rem',
                        color: 'primary.dark'
                    }}>
                        פעולות
                    </Box>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="ביצוע זיכויים" arrow>
                            <IconButton
                                onClick={() => popup({
                                    title: "ביצוע זיכויים",
                                    content: <MissingProductsCredit collectionGroupId={collectionGroupId} />
                                })}
                                size="small"
                                sx={{
                                    color: '#2e7d32',
                                    width: 28,
                                    height: 28,
                                    '&:hover': {
                                        backgroundColor: '#2e7d3220',
                                        transform: 'scale(1.05)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <PaymentIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="צינתוק חוסרים" arrow>
                            <IconButton
                                onClick={sendTzintuk.mutate}
                                size="small"
                                sx={{
                                    color: '#1976d2',
                                    width: 28,
                                    height: 28,
                                    '&:hover': {
                                        backgroundColor: '#1976d220',
                                        transform: 'scale(1.05)'
                                    },
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <PhoneIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                {printComponent}
            </Stack>
        </Box>
    );
};

export default PrintActionsCell;