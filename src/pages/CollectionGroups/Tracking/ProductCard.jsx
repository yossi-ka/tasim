
import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Collapse,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Stack,
    Divider,
    Button
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { updateMissingProduct } from "../../../api/services/collectionGroups";
import Context from "../../../context";
import { useMutation } from "react-query";

// סטטוסים כמו ב-OrderCard
const statusColors = {
    onShelf: 'grey.400',      // על המדף (2)
    inCart: 'warning.main',   // בעגלה (5)
    inBox: 'success.main',    // בקרטון (3)
    missing: 'error.main'     // חסר (4)
};

const statusLabels = {
    onShelf: 'על המדף',
    inCart: 'בעגלה',
    inBox: 'בקרטון',
    missing: 'חסר'
};

const statusIcons = {
    onShelf: <ShoppingCartIcon fontSize="small" color="disabled" />,
    inCart: <ShoppingCartIcon fontSize="small" color="warning" />,
    inBox: <ShoppingCartIcon fontSize="small" color="success" />,
    missing: <ShoppingCartIcon fontSize="small" color="error" />
};

const ProductCard = ({ product, refetch }) => {

    const { snackbar, user } = React.useContext(Context);
    const [open, setOpen] = useState(false);
    const { orders = [], statusSummary = {} } = product;
    const total = orders.length;
    // כמו ב-OrderCard: מיפוי סטטוסים לערכים
    const statusMap = [
        { key: 'status2', label: 'על המדף', color: statusColors.onShelf },
        { key: 'status5', label: 'בעגלה', color: statusColors.inCart },
        { key: 'status4', label: 'חסר', color: statusColors.missing },
        { key: 'status3', label: 'בקרטון', color: statusColors.inBox }
    ];
    // יצירת מערך של ערכים קיימים בלבד
    const statusCounts = statusMap
        .map(({ key, label, color }) => ({
            count: product?.[key] ? product[key] : 0,
            label,
            color
        }))
        .filter(item => item.count > 0);
    // חישוב אחוזים לכל סטטוס (רק עבור אלו שיש להם ערך)
    const statusPercents = statusCounts.map(item => ({
        ...item,
        percent: total ? Math.round((item.count / total) * 100) : 0
    }));


    const updateMissing = useMutation((id) => updateMissingProduct(id, user.id), {
        onSuccess: () => {
            refetch(); // רענון הנתונים לאחר עדכון
            snackbar("המוצר עודכן בהצלחה", "success");
        },
        onError: (error) => {
            snackbar(error.message || "שגיאה בעדכון המוצר", "error");
        }
    });

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                {/* הצגת productName בראש הכרטיס */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 0.5, borderRadius: 2, fontWeight: 'bold', fontSize: 18 }}>
                        {product.productPlace || ''}
                    </Box>
                    <Typography variant="h6" sx={{ ml: 2 }}>{product.productName || ""}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <IconButton onClick={() => setOpen(o => !o)}>
                        <ExpandMoreIcon />
                    </IconButton>
                </Box>
                {/* הצגת סיכום סטטוסים מחוץ לקולאפס */}
                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    {statusCounts.map((item, idx) => (
                        <Typography key={idx} variant="subtitle2" sx={{ color: item.color, fontWeight: 500 }}>
                            {item.count} {item.label}
                        </Typography>
                    ))}
                </Stack>
                {/* פס התקדמות צבעוני לפי סטטוסים */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {statusPercents.map((item, idx) => (
                        <Box key={idx} sx={{ flex: item.percent, bgcolor: item.color, height: 10, borderRadius: 2 }} />
                    ))}
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    {statusPercents.map((item, idx) => (
                        <Typography key={idx} variant="caption" color={item.color}>{item.percent}% {item.label}</Typography>
                    ))}
                </Stack>
            </CardContent>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <CardContent>
                    <List dense>
                        {orders.length === 0 ? (
                            <Typography color="text.secondary">אין הזמנות למוצר זה</Typography>
                        ) : (
                            orders.map((orderProduct, idx) => {
                                // מיפוי סטטוס מספרי ל-label ול-icon
                                let statusKey = 'onShelf';
                                if (orderProduct.status === 5) statusKey = 'inCart';
                                else if (orderProduct.status === 3) statusKey = 'inBox';
                                else if (orderProduct.status === 4) statusKey = 'missing';

                                const showMissingBtn = product.status === 1 || product.status === 2 || product.status === 5;

                                // אחרת נשאר onShelf
                                return (
                                    <ListItem key={orderProduct.id || idx}
                                        secondaryAction={
                                            showMissingBtn ? (
                                                <Button
                                                    onClick={() => updateMissing.mutate(orderProduct.id)}
                                                    disabled={updateMissing.isLoading}
                                                    size="small" color="error" variant="outlined" sx={{ minWidth: 0, px: 1, fontSize: 12 }}>
                                                    המוצר חסר
                                                </Button>
                                            ) : null
                                        }>
                                        <ListItemIcon>
                                            {statusIcons[statusKey]}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={orderProduct.orderFullName || orderProduct.order?.id || orderProduct.orderId}
                                            secondary={`כמות: ${orderProduct.quantityOrWeight} | סטטוס: ${statusLabels[statusKey]}`}
                                        />
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default ProductCard;
