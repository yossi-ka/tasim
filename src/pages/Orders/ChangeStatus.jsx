import { Alert, AlertTitle, Box, Button, Chip, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React from "react";
import Context from "../../context";
import GenericForm from "../../components/GenericForm";
import { useMutation, useQuery } from "react-query";
import { changeOrdersStatus } from "../../api/services/orders";
import { addToCollectionGroup, getOpenCollectionGroups, getProccessingCollectionGroups } from "../../api/services/collectionGroups";
import { formatDateTime } from "../../utils/func";

const ChangeStatus = ({ rows, refetch, status }) => {

    const { closePopup, user, snackbar, getLookupName } = React.useContext(Context);

    const [initInputs, setInitInputs] = React.useState({});
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

    const handleSubmitCollection = useMutation((data) => addToCollectionGroup(data.lineId, ids, user.id), {
        onSuccess: (groupId) => {
            closePopup();
            snackbar("ההזמנות נוספו לקבוצת ליקוט בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            snackbar(error.message, "error");
        }
    });

    const { data, isLoading } = useQuery(
        "getOpenCollectionGroups", getProccessingCollectionGroups)


    const isLineInProcess = React.useMemo(() => {
        if (!initInputs.lineId || !data) return false;
        return data.some(group => group.lineId === initInputs.lineId && group.status !== 1);
    }, [initInputs.lineId, data]);

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

    const options = React.useMemo(() => {
        return [
            // { value: 1, label: "ראשוני" },
            { value: 3, label: "ממתין למשלוח" },
            { value: 4, label: "משלוח" },
            { value: 5, label: "הסתיים" }
        ].filter(option => option.value !== status);
    }, [status]);

    console.log(initInputs.status, "initInputs.status")

    return (
        <Stack direction="column" spacing={2} sx={{ pb: 5 }}>
            <Typography variant="h4" color="primary.main">{rows.length == 1 ? "הזמנת משפחת " + (rows[0].lastName || "") : rows.length + " הזמנות נבחרו"}</Typography>

            {status == 1 && <Divider textAlign="left" sx={{ pt: 4 }}>
                <Chip label="קבוצת ליקוט" size="small" />
            </Divider>}

            {status == 1 && <GenericForm
                fields={[
                    {
                        cb: () => <Alert severity="info">
                            <AlertTitle>קבוצות פעילות:</AlertTitle>
                            {isLoading ? "טוען קבוצות ליקוט..." : data.length > 0 ? data.map((group) => (
                                <Typography key={group.id} variant="body2">נפתח ב: <strong>{formatDateTime(group.createdAt?.toDate?.())}</strong> מסלול: <strong>{getLookupName("collectionsGroupLines", group.lineId)}</strong>
                                    סטטוס <strong>{getLookupName("globalStatusCollectionGroups", group.status)}</strong></Typography>
                            )) : "אין קבוצות פעילות כרגע"}
                        </Alert>
                    },
                    ...(isLineInProcess ? [{
                        cb: () => <Alert severity="error">
                            לא ניתן להוסיף הזמנות לקבוצה בתהליך
                        </Alert>
                    }] : []),
                    {
                        name: "lineId",
                        variant: "outlined",
                        size: 6,
                        label: "מסלול ליקוט",
                        type: "lookup",
                        lookup: "collectionsGroupLines",
                        required: true,
                    },
                    {
                        variant: "contained",
                        disabled: handleSubmit.isLoading || handleSubmitCollection.isLoading || isLineInProcess,
                        type: "submit",
                        size: 6,
                        label: "אישור שיוך לקבוצה",
                    }
                ]}
                onSubmit={(data) => {
                    const objToSend = {
                        lineId: data.lineId, // מסלול ליקוט
                    }

                    handleSubmitCollection.mutate(objToSend);
                }}
                initInputs={initInputs}
                setInitInput={setInitInputs}
            />}

            {/* {status == 1 && <Divider textAlign="left" sx={{ pt: 4 }}>
                <Chip label="ליקוט פרטני" size="small" />
            </Divider>} */}

            {status !== 1 && <>
                <Alert severity="info">
                    <AlertTitle>שים לב להעביר לסטטוס הנכון!</AlertTitle>
                    <Typography variant="body2">בהעברה לסטטוס הסתיים לא נשלח צינתוק</Typography>
                </Alert>
                <GenericForm
                    initInputs={initInputs}
                    setInitInput={setInitInputs}
                    fields={[
                        {
                            name: "status",
                            variant: "outlined",
                            size: 6,
                            label: "העברה לסטטוס",
                            type: "select",
                            options: options,
                            required: true,
                            // displayConditionGrid: () => status !== 2
                        },
                        {
                            name: "employeeId",
                            variant: "outlined",
                            size: 6,
                            label: "עובד",
                            type: "lookup",
                            lookup: "employeesActive",
                            required: true,
                            displayConditionGrid: () => initInputs.status === 4
                        },
                        {
                            variant: "contained",
                            disabled: handleSubmit.isLoading || handleSubmitCollection.isLoading,
                            type: "submit",
                            size: 12,
                            label: "אישור שינוי סטטוס",
                        }
                    ]}
                    onSubmit={(data) => {
                        const objToSend = {
                            // orderStatus: status + 1, // סטטוס ליקוט
                            orderStatus: data.status, // סטטוס ליקוט
                            employeeId: data.employeeId ? data.employeeId : null // אם יש עובד ליקוט,
                        }
                        if (objToSend.orderStatus === 5) {
                            objToSend.isSentTzintuk = false; // אם סטטוס סיום, לא נשלח טופס צינטוק
                        }

                        handleSubmit.mutate(objToSend);
                    }}
                /></>}
        </Stack>
    );
}

export default ChangeStatus;