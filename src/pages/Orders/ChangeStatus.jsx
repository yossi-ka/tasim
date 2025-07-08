import { Alert, AlertTitle, Box, Button, Chip, Divider, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import React from "react";
import Context from "../../context";
import GenericForm from "../../components/GenericForm";
import { useMutation, useQuery } from "react-query";
import { changeOrdersStatus } from "../../api/services/orders";
import { addToCollectionGroup, getOpenCollectionGroups } from "../../api/services/collectionGroups";
import { formatDateTime } from "../../utils/func";

const ChangeStatus = ({ rows, refetch, status }) => {
    const { closePopup, user, snackbar, getLookupName } = React.useContext(Context);

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
        "getOpenCollectionGroups", getOpenCollectionGroups)

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

    console.log("data", data);
    return (
        <Stack direction="column" spacing={2}>
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
                                <Typography key={group.id} variant="body2">נפתח ב: <strong>{formatDateTime(group.createdAt?.toDate?.())}</strong> מסלול: <strong>{getLookupName("collectionsGroupLines", group.lineId)}</strong></Typography>
                            )) : "אין קבוצות פעילות כרגע"}
                        </Alert>
                    },
                    // {
                    //     cb: () => <ToggleButtonGroup
                    //         color="primary"
                    //         // value={alignment}
                    //         exclusive
                    //         // onChange={handleChange}
                    //         aria-label="Platform"
                    //         size="small"
                    //     >
                    //         <ToggleButton size="small" value="1">חדש</ToggleButton>
                    //         <ToggleButton size="small" value="2">הוספה לקבוצה</ToggleButton>

                    //     </ToggleButtonGroup>,
                    //     size: 3
                    // },
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
                        disabled: handleSubmit.isLoading || handleSubmitCollection.isLoading,
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
            />}

            {status == 1 && <Divider textAlign="left" sx={{ pt: 4 }}>
                <Chip label="ליקוט פרטני" size="small" />
            </Divider>}

            <Typography variant="h4" color="success.main">העברת הזמנה ל{statusName}</Typography>
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
                        disabled: handleSubmit.isLoading || handleSubmitCollection.isLoading,
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