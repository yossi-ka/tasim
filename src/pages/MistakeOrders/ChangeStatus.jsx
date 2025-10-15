import React from "react";
import { useMutation } from "react-query";
import {
    Box,
    Typography,
    Alert,
    AlertTitle,
    Stack,
    Chip
} from "@mui/material";

import Context from "../../context";
import GenericForm from "../../components/GenericForm";
import { updateMistakeOrderStatus } from "../../api/services/mistakeOrders";

const ChangeMistakeOrderStatus = ({ rows, refetch }) => {
    const { closePopup, user, snackbar } = React.useContext(Context);

    const [initInputs, setInitInputs] = React.useState({
        status: rows.length > 0 ? parseInt(rows[0].status) || 1 : 1
    });

    const ids = React.useMemo(() => rows.map((row) => row.id), [rows]);

    const handleSubmit = useMutation(
        (data) => {
            // עדכון כל הפניות שנבחרו
            const promises = ids.map(id => updateMistakeOrderStatus(id, data.status, user.id));
            return Promise.all(promises);
        },
        {
            onSuccess: () => {
                closePopup();
                snackbar("סטטוס עודכן בהצלחה", "success");
                refetch();
            },
            onError: (error) => {
                snackbar(error.message || "שגיאה בעדכון הסטטוס", "error");
            }
        }
    );

    const currentStatus = React.useMemo(() => {
        if (rows.length === 0) return "לא ידוע";
        const status = parseInt(rows[0].status) || 1;
        switch (status) {
            case 1: return "חדש";
            case 2: return "בטיפול";
            case 3: return "סגור";
            default: return "לא ידוע";
        }
    }, [rows]);

    const options = React.useMemo(() => {
        return [
            { value: 1, label: "חדש" },
            { value: 2, label: "בטיפול" },
            { value: 3, label: "סגור" }
        ];
    }, []);

    return (
        <Stack direction="column" spacing={2} sx={{ pb: 5 }}>
            <Typography variant="h5" color="primary.main">
                שינוי סטטוס פניות
            </Typography>

            {rows.length === 1 && (
                <Box>
                    <Typography variant="body1">
                        הזמנה: <strong>{rows[0].nbsOrderId}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        סטטוס נוכחי: <Chip label={currentStatus} size="small" color="primary" />
                    </Typography>
                </Box>
            )}

            {rows.length > 1 && (
                <Typography variant="body1">
                    <strong>{rows.length}</strong> פניות נבחרו לעדכון סטטוס
                </Typography>
            )}

            <Alert severity="info">
                <AlertTitle>הערה חשובה</AlertTitle>
                <Typography variant="body2">
                    שינוי סטטוס ל"סגור" יסמן את הפניה כלא פעילה ותוסר מהרשימה הראשית
                </Typography>
            </Alert>

            <GenericForm
                initInputs={initInputs}
                setInitInput={setInitInputs}
                fields={[
                    {
                        name: "status",
                        variant: "outlined",
                        size: 12,
                        label: "סטטוס חדש",
                        type: "select",
                        options: options,
                        required: true
                    },
                    {
                        variant: "contained",
                        disabled: handleSubmit.isLoading,
                        type: "submit",
                        size: 12,
                        label: "עדכן סטטוס",
                        color: "primary"
                    }
                ]}
                onSubmit={(data) => {
                    handleSubmit.mutate(data);
                }}
            />
        </Stack>
    );
};

export default ChangeMistakeOrderStatus;