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

// כרטיס הזמנה עם קולאפס למוצרים ואחוז התקדמות
const statusColors = {
    onShelf: 'grey.400',      // לא נאסף מהמדף
    collected: 'warning.main',// נאסף מהמדף, לא הונח
    placed: 'success.main'    // הונח בהזמנה
};

const statusLabels = {
    onShelf: 'על המדף',
    collected: 'נאסף מהמדף',
    placed: 'הונח בהזמנה'
};

const statusIcons = {
    onShelf: <ShoppingCartIcon fontSize="small" color="disabled" />,
    collected: <ShoppingCartIcon fontSize="small" color="warning" />,
    placed: <ShoppingCartIcon fontSize="small" color="success" />
};

const OrderCard = ({ order, getLookupName }) => {
    const [open, setOpen] = useState(false);
    // חישוב סטטיסטיקות
    const total = order.products.length;
    const countOnShelf = order.countOnShelf ?? order.products.filter(p => p.status === 'onShelf').length;
    const countCollected = order.countCollected ?? order.products.filter(p => p.status === 'collected').length;
    const countPlaced = order.countPlaced ?? order.products.filter(p => p.status === 'placed').length;

    // חישוב אחוזים לכל סטטוס
    const percentPlaced = total ? Math.round((countPlaced / total) * 100) : 0;
    const percentCollected = total ? Math.round((countCollected / total) * 100) : 0;
    const percentOnShelf = total ? Math.round((countOnShelf / total) * 100) : 0;

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
                {/* <Typography variant="body2" color="text.secondary">
                    סטטוס: {getLookupName ? getLookupName("orderStatus", order.orderStatus) : order.orderStatus}
                </Typography> */}
                <Box sx={{ mt: 2 }}>
                    {/* פס התקדמות צבעוני לפי סטטוסים */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: percentPlaced, bgcolor: statusColors.placed, height: 10, borderRadius: 2 }} />
                        <Box sx={{ flex: percentCollected, bgcolor: statusColors.collected, height: 10, borderRadius: 2 }} />
                        <Box sx={{ flex: percentOnShelf, bgcolor: statusColors.onShelf, height: 10, borderRadius: 2 }} />
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color={statusColors.placed}>{percentPlaced}% בקרטון</Typography>
                        <Typography variant="caption" color={statusColors.collected}>{percentCollected}% נאסף</Typography>
                        <Typography variant="caption" color={statusColors.onShelf}>{percentOnShelf}% על המדף</Typography>
                    </Stack>
                </Box>
            </CardContent>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <CardContent>
                    <List dense>
                        {order.products.map(product => (
                            <ListItem key={product.id}>
                                <ListItemIcon>
                                    {statusIcons[product.status || 'onShelf']}
                                </ListItemIcon>
                                <ListItemText
                                    primary={product.productName}
                                    // primary={product.firstName || '' || '' + product.lastName ? `${product.firstName || ''} ${product.lastName || ''}` : (product.productName || product.name)}
                                    secondary={`כמות: ${product.quantityOrWeight} | סטטוס: ${statusLabels[product.status || 'onShelf']}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default OrderCard;
