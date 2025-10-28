import React from 'react'
import useTerms from '../../terms'
import GenericForm from '../../components/GenericForm';
import { outlinedInputClasses } from '@mui/material';
import { useMutation } from 'react-query';
import { createRental, updateRental } from '../../api/services/rentals';
import Context from '../../context';

function AddOrEditRental({ row, refetch, statuses }) {

    const { user, snackbar, closePopup } = React.useContext(Context)


    const [initInputs, setInitInputs] = React.useState(row || {});

    const term = useTerms("addOrEditRentalForm");

    const update = useMutation(data => row?.id ? updateRental(row?.id, data, user.id) : createRental(data, user.id), {
        onSuccess: () => {
            snackbar("עדכון בוצע בהצלחה");
            closePopup();
            refetch()
        },
        onError: () => {
            snackbar("שגיאה בעדכון", "error");
        }
    })

    const fields = [
        { type: 'line', label: "פרטי לקוח" },
        term.field("customerName", { variant: "outlined", size: 6 }),
        term.field("city", { variant: "outlined", size: 6 }),
        term.field("phone", { variant: "outlined", size: 6 }),
        term.field("sheetsId", { variant: "outlined", size: 6 }),
        { type: 'line', label: "פרטי נסיעה" },
        term.field("startDate", { variant: "outlined", size: 6 }),
        term.field("endDate", { variant: "outlined", size: 6 }),
        term.field("stateId", { variant: "outlined", size: 6 }),
        term.field("deviceId", { variant: "outlined", size: 6 }),
        term.field("price", { variant: "outlined", size: 6 }),
        { type: "line", label: "פרטים נוספים" },
        term.field("agentId", { variant: "outlined", size: 6 }),
        term.field("note", { variant: "outlined", size: 6 }),
        { type: 'submit', label: "שמור", variant: "contained", disabled: update.isLoading }
    ];


    return (
        <GenericForm
            fields={fields}
            initInputs={initInputs}
            setInitInput={setInitInputs}
            onSubmit={(data) => {
                const obj = {
                    customerName: data.customerName || "",
                    phone: data.phone || "",
                    city: data.city || "",
                    startDate: data.startDate || "",
                    endDate: data.endDate || "",
                    price: data.price || 0,
                    agentId: data.agentId || "",
                    deviceId: data.deviceId || 0,
                    note: data.note || '',
                    stateId: data.stateId || ''
                };

                update.mutate(obj);
            }}
        />
    )
}

export default AddOrEditRental