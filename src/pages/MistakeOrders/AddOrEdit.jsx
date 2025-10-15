import React, { useState } from "react";
import { useMutation } from "react-query";
import {
    Box,
    Typography,
    Button,
    Alert,
    Card,
    CardContent,
    IconButton,
    Stack,
    TextField
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';

import Context from "../../context";
import useTerms from "../../terms";
import GenericForm from "../../components/GenericForm";
import GenericTable from "../../components/GenericTable";
import {
    addMistakeOrder,
    updateMistakeOrder,
    findOrderByNbsOrderId,
    addMistakeOrderType
} from "../../api/services/mistakeOrders";

const AddOrEditMistakeOrder = ({ row, refetch }) => {
    const { popup, closePopup, smallPopup, closeSmallPopup, snackbar, user } = React.useContext(Context);

    const terms = useTerms("addMistakeOrder");
    const mistakeTypeTerms = useTerms("mistakeOrderType");
    const orderItemsTableTerms = useTerms("orderItemsTable");

    // שלב 1: בחירת הזמנה
    const [nbsOrderId, setNbsOrderId] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderSearchError, setOrderSearchError] = useState("");

    // שלב 2: טופס הפניה
    const [inputs, setInputs] = useState(row ? {
        mistakeOrderTypeId: row.mistakeOrderTypeId || "",
        description: row.description || ""
    } : {
        mistakeOrderTypeId: "",
        description: ""
    });

    // מיוטיישן לחיפוש הזמנה
    const searchOrderMutation = useMutation(findOrderByNbsOrderId, {
        onSuccess: (orderData) => {
            if (orderData) {
                setSelectedOrder(orderData);
                setOrderSearchError("");
            } else {
                setSelectedOrder(null);
                setOrderSearchError("ההזמנה לא נמצאה במערכת");
            }
        },
        onError: () => {
            setSelectedOrder(null);
            setOrderSearchError("שגיאה בחיפוש ההזמנה");
        }
    });

    // מיוטיישן להוספת סוג טעות חדש
    const addTypeMutation = useMutation(
        (data) => addMistakeOrderType(data, user.id),
        {
            onSuccess: () => {
                snackbar("סוג הטעות נוסף בהצלחה", "success");
                // כאן צריך לרענן את ה-lookup
                window.location.reload(); // פתרון זמני
            },
            onError: () => {
                snackbar("שגיאה בהוספת סוג הטעות", "error");
            }
        }
    );

    // מיוטיישן לשמירת הפניה
    const saveMutation = useMutation(
        (data) => row ?
            updateMistakeOrder(row.id, data, user.id) :
            addMistakeOrder(data, user.id),
        {
            onSuccess: () => {
                snackbar(row ? "הפניה עודכנה בהצלחה" : "הפניה נוספה בהצלחה", "success");
                closePopup();
                refetch();
            },
            onError: (error) => {
                snackbar(error.message || "שגיאה בשמירת הפניה", "error");
            }
        }
    );

    const handleOrderSearch = () => {
        if (!nbsOrderId.trim()) {
            setOrderSearchError("יש להזין מספר הזמנה");
            return;
        }
        searchOrderMutation.mutate(nbsOrderId.trim());
    };

    const handleResetOrder = () => {
        setSelectedOrder(null);
        setNbsOrderId("");
        setOrderSearchError("");
    };

    const handleAddMistakeType = () => {
        smallPopup({
            title: "הוספת סוג טעות חדש",
            content: (
                <GenericForm
                    fields={mistakeTypeTerms.getTerms()}
                    initInputs={{ name: "" }}
                    onSubmit={(data) => {
                        addTypeMutation.mutate(data);
                        closeSmallPopup();
                    }}
                    submitText="הוסף"
                />
            )
        });
    };

    const handleSubmit = () => {

        if (!row && !selectedOrder) {
            snackbar("יש לבחור הזמנה תחילה", "error");
            return;
        }

        if (!inputs.mistakeOrderTypeId || !inputs.description?.trim()) {
            console.log("Validation failed:", {
                mistakeOrderTypeId: inputs.mistakeOrderTypeId,
                description: inputs.description
            });
            snackbar("יש למלא את כל השדות הנדרשים", "error");
            return;
        }

        const dataToSave = {
            ...inputs,
            ...(selectedOrder && { orderId: selectedOrder.id, nbsOrderId: selectedOrder.nbsOrderId })
        };

        saveMutation.mutate(dataToSave);
    };

    // עדכון השדות עם אייקון הוספה לסוג טעות
    const fieldsWithAddButton = terms.getTerms().map(field => {
        if (field.name === 'mistakeOrderTypeId') {
            return {
                ...field,
                required: true,
                actions: [
                    {
                        icon: <AddIcon />,
                        onClick: handleAddMistakeType,
                        tooltip: "הוסף סוג טעות חדש"
                    }
                ]
            };
        }
        if (field.name === 'description') {
            return {
                ...field,
                required: true
            };
        }
        return field;
    });

    return (
        <Box sx={{ p: 2, minWidth: 500 }}>
            {!row && ( // רק בהוספה חדשה מציגים בחירת הזמנה
                <>
                    {!selectedOrder ? (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                שלב 1: בחירת הזמנה
                            </Typography>

                            <Stack direction="row" spacing={2} alignItems="center">
                                <TextField
                                    label="מספר הזמנה"
                                    value={nbsOrderId}
                                    onChange={(e) => setNbsOrderId(e.target.value)}
                                    variant="outlined"
                                    size="small"
                                    sx={{ flex: 1 }}
                                />

                                <Button
                                    variant="contained"
                                    onClick={handleOrderSearch}
                                    disabled={searchOrderMutation.isLoading}
                                    startIcon={<SearchIcon />}
                                >
                                    איתור
                                </Button>
                            </Stack>

                            {orderSearchError && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {orderSearchError}
                                </Alert>
                            )}
                        </Box>
                    ) : (
                        <Card sx={{ mb: 3, backgroundColor: 'success.lighter' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" color="success.main">
                                            הזמנה נמצאה
                                        </Typography>
                                        <Typography variant="body2">
                                            מספר הזמנה: {selectedOrder.nbsOrderId}
                                        </Typography>
                                        <Typography variant="body2">
                                            לקוח: {selectedOrder.firstName} {selectedOrder.lastName}
                                        </Typography>
                                        <Typography variant="body2">
                                            כתובת: {selectedOrder.street} {selectedOrder.houseNumber}
                                        </Typography>

                                        {selectedOrder.items && selectedOrder.items.length > 0 && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                                                    פריטים בהזמנה ({selectedOrder.items.length}):
                                                </Typography>

                                                <GenericTable
                                                    columns={orderItemsTableTerms.table()}
                                                    data={selectedOrder.items.map(item => {
                                                        return {
                                                            ...item,
                                                            productName: item.productName || item.name || item.displayName || 'שם מוצר לא זמין',
                                                            sku: item.sku || item.productSku || '-',
                                                            quantity: item.quantityOrWeight || 0,
                                                            unitPrice: item.price || 0,
                                                            totalPrice: (item.quantityOrWeight * item.price) || 0
                                                        };
                                                    })}
                                                    pagination={false}
                                                    dense={true}
                                                    customHeight={{
                                                        container: 200,
                                                        tableContent: 1,
                                                        header: 0,
                                                        footer: 1
                                                    }}
                                                />
                                            </Box>
                                        )}

                                        {selectedOrder.items && selectedOrder.items.length === 0 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                אין פריטים בהזמנה זו
                                            </Typography>
                                        )}
                                    </Box>

                                    <IconButton onClick={handleResetOrder} color="error">
                                        <CloseIcon />
                                    </IconButton>
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            {(row || selectedOrder) && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {row ? "עריכת פניה" : "שלב 2: פרטי הפניה"}
                    </Typography>

                    <GenericForm
                        fields={fieldsWithAddButton}
                        initInputs={inputs}
                        setInitInput={setInputs}
                        onSubmit={handleSubmit}
                        submitText={row ? "עדכן" : "שלח פניה"}
                        isLoading={saveMutation.isLoading}
                    />
                </Box>
            )}
        </Box>
    );
};

export default AddOrEditMistakeOrder;