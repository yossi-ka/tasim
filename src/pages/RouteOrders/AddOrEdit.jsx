import React from "react";
import { useMutation } from "react-query";
import { Alert } from "@mui/material";
import GenericForm from "../../components/GenericForm";
import useTerms from "../../terms";
import Context from "../../context";
import { addSingleRouteOrder, updateSingleRouteOrder } from "../../api/services/routeOrders";

const AddOrEditRouteOrder = ({ row, refetch }) => {

    const { user, closePopup, snackbar } = React.useContext(Context);
    const [initInputs, setInitInputs] = React.useState(row ? { ...row } : {});

    const isEdit = Boolean(row?.id);

    // מיוטיישן להוספת סדר מסלול חדש (עם הזזת קיימים)
    const addRouteOrderMutation = useMutation(
        (routeOrderData) => addSingleRouteOrder(routeOrderData, user.id),
        {
            onSuccess: (result) => {
                let successMessage = `סדר המסלול נוסף בהצלחה!`;
                if (result.totalShifted > 0) {
                    successMessage += ` הוזזו ${result.totalShifted} סדרי מסלולים קיימים.`;
                }

                snackbar(successMessage, 'success');

                refetch();
                closePopup();

            },
            onError: (error) => {
                console.error('Error adding route order:', error);
                snackbar(error.message || 'שגיאה בהוספת סדר המסלול', 'error');
            }
        }
    );

    // מיוטיישן לעדכון סדר מסלול קיים
    const updateRouteOrderMutation = useMutation(
        (routeOrderData) => updateSingleRouteOrder(row.id, routeOrderData, user.id),
        {
            onSuccess: () => {
                snackbar("סדר המסלול עודכן בהצלחה!", 'success');
                closePopup();

                refetch();

            },
            onError: (error) => {
                console.error('Error updating route order:', error);
                snackbar(error.message || 'שגיאה בעדכון סדר המסלול', 'error');
            }
        }
    );

    const term = useTerms("routeOrdersUpdate")
    const fields = [
        term.field("street", { variant: "outlined", size: 8, required: true, disabled: row ? true : false }),
        term.field("buildingNumber", { variant: "outlined", size: 2, required: true, disabled: row ? true : false }),
        term.field("orderNumber", { variant: "outlined", size: 2, required: true }),
        {
            cb: () => <Alert severity="info" sx={{ mb: 2 }}>
                שים לב, בעריכת מספר סדר עליך לוודא שהמספר פנוי ותקין.
            </Alert>,
            displayConditionGrid: () => row ? true : false
        },
        {
            cb: () => <Alert severity="info" sx={{ mb: 2 }}>
                שים לב, בהוספת כתובת חדשה, כל המספרים יתקדמו במספר נוסף.
            </Alert>,
            displayConditionGrid: () => row ? false : true
        },
        {
            type: 'submit',
            label: row ? "עדכן סדר מסלול" : "הוסף סדר מסלול",
            size: 12,
            variant: "contained",
            loading: addRouteOrderMutation.isLoading || updateRouteOrderMutation.isLoading
        }
    ]

    const handleSubmit = (data) => {

        if (isEdit) {
            updateRouteOrderMutation.mutate(data);
        } else {
            addRouteOrderMutation.mutate(data);
        }
    };

    return (
        <>


            <GenericForm
                fields={fields}
                initInputs={initInputs}
                setInitInput={setInitInputs}
                onSubmit={handleSubmit}
            />
        </>
    );
}

export default AddOrEditRouteOrder;