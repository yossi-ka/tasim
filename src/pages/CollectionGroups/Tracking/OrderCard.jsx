import React, { useState } from "react";
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    LinearProgress,
    Collapse,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Stack,
    Button,
    CircularProgress
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useMutation } from "react-query";
import { updateMissingProduct } from "../../../api/services/collectionGroups";
import Context from "../../../context";

// כרטיס הזמנה עם קולאפס למוצרים ואחוז התקדמות
const statusColors = {
    onShelf: 'grey.400',      // על המדף
    inCart: 'warning.main',   // בעגלה
    inBox: 'success.main',    // בקרטון
    missing: 'error.main'     // חסר
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

const OrderCard = ({ order, refetch }) => {

    const { snackbar, user } = React.useContext(Context);
    const [open, setOpen] = useState(false);
    const total = order.products.length;
    // מיפוי סטטוסים לערכים
    const statusMap = [
        { key: 'countStatus2', label: 'על המדף', color: statusColors.onShelf },
        { key: 'countStatus5', label: 'בעגלה', color: statusColors.inCart },
        { key: 'countStatus3', label: 'בקרטון', color: statusColors.inBox },
        { key: 'countStatus4', label: 'חסר', color: statusColors.missing }
    ];

    // יצירת מערך של ערכים קיימים בלבד
    const statusCounts = statusMap
        .map(({ key, label, color }) => ({
            count: order[key] || 0,
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
                {/* הצגת collectionGroupOrder בראש הכרטיס */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 0.5, borderRadius: 2, fontWeight: 'bold', fontSize: 18 }}>
                        {order.collectionGroupOrder}
                    </Box>
                    <Typography variant="h6" sx={{ ml: 2 }}>{[order.firstName, order.lastName].filter(Boolean).join(" ")}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <IconButton onClick={() => setOpen(o => !o)}>
                        <ExpandMoreIcon />
                    </IconButton>
                </Box>
                {/* הצגת סיכום סטטוסים */}
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
                        {order.products.map(product => {
                            // מיפוי סטטוס מספרי ל-label ול-icon
                            let statusKey = 'onShelf';
                            if (product.status === 5) statusKey = 'inCart';
                            else if (product.status === 3) statusKey = 'inBox';
                            else if (product.status === 4) statusKey = 'missing';
                            // אחרת נשאר onShelf
                            const showMissingBtn = product.status === 2 || product.status === 5;
                            return (
                                <ListItem key={product.id} secondaryAction={
                                    showMissingBtn ? (
                                        <Button
                                            onClick={() => updateMissing.mutate(product.id)}
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
                                        primary={product.productName}
                                        secondary={`כמות: ${product.quantityOrWeight} | סטטוס: ${statusLabels[statusKey]}`}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default OrderCard;
