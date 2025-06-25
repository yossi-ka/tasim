import { Stack, Typography } from "@mui/material";
import React from "react";
import Context from "../../context";
import GenericForm from "../../components/GenericForm";
import { useMutation } from "react-query";
import { changeOrdersStatus } from "../../api/services/orders";

const ChangeStatus = ({ rows, refetch, status }) => {
    const { closePopup, user, snackbar } = React.useContext(Context);

    const ids = React.useMemo(() => rows.map((row) => row.id), [rows]);
    const handleSubmit = useMutation((data) => changeOrdersStatus(ids, data, user.id), {
        onSuccess: () => {
            closePopup();
            snackbar("סטטוס עודכן בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            snackbar(error.message, "error");
        }
    });

    const statusName = React.useMemo(() => {
        switch (status) {
            case 1:
                return "ליקוט";
            case 2:
                return "המתנה למשלוח";
            case 3:
                return "משלוח";
            case 4:
                return "סיום";
            default:
                return "לא ידוע";
        }
    }, [status]);

    return (
        <Stack direction="column" spacing={2}>
            <Typography variant="h4" color="success.main">העברת הזמנה ל{statusName}</Typography>
            <Typography variant="h6" color="primary.main">{rows.length == 1 ? "הזמנת משפחת " + (rows[0].lastName || "") : rows.length + " הזמנות"}</Typography>
            <GenericForm
                fields={[
                    {
                        name: "employeeId",
                        variant: "outlined",
                        size: 6,
                        label: "עובד",
                        type: "lookup",
                        lookup: "employeesActive",
                        required: true,
                        displayConditionGrid: () => status !== 2
                    },
                    {
                        variant: "contained",
                        disabled: handleSubmit.isLoading,
                        type: "submit",
                        size: 6,
                        label: "אישור שינוי סטטוס",
                    }
                ]}
                onSubmit={(data) => {
                    const objToSend = {
                        orderStatus: status + 1, // סטטוס ליקוט
                        employeeId: data.employeeId ? data.employeeId : null // אם יש עובד ליקוט,
                    }

                    handleSubmit.mutate(objToSend);
                }}
            />
        </Stack>
    );
}

export default ChangeStatus;