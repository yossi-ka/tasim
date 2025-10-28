import React from "react";
import { useMutation } from "react-query";

import Context from "../../context";
import useTerms from "../../terms";
import GenericForm from "../../components/GenericForm";
import { addDevice, updateDevice } from "../../api/services/devices";

const AddOrEditDevice = ({ row, statuses }) => {
    const { user, snackbar, closePopup } = React.useContext(Context);
    const [initInputs, setInitInputs] = React.useState(row || {});

    const term = useTerms("devicesTable");

    const update = useMutation(obj => row ? updateDevice(row.id, obj, user.id) : addDevice(obj, user.id), {
        onSuccess: (data) => {
            closePopup();
            snackbar("עדכון בוצע בהצלחה", "success");
            window.location.reload();
        },
        onError: (error) => {
            console.error("Error updating supplier:", error);
            snackbar("עדכון נכשל", "error");
        }
    });

    const fields = row ? [
        term.field("name", { variant: "outlined", size: 12, required: true }),
        term.field("purchaseDate", { variant: "outlined", size: 12 }),
        term.field("modelId", { variant: "outlined", size: 12 }),
        {
            name: "status",
            variant: "outlined",
            size: 12,
            label: "העברה לסטטוס",
            type: "select",
            options: statuses,
            required: true,
            display: row
        },
        { type: 'submit', label: row ? "עדכן מכשיר" : "הוסף מכשיר", variant: "contained", disabled: update.isLoading }
    ] : [
        term.field("name", { variant: "outlined", size: 12, required: true }),
        term.field("purchaseDate", { variant: "outlined", size: 12 }),
        term.field("modelId", { variant: "outlined", size: 12 }),
        { type: 'submit', label: row ? "עדכן מכשיר" : "הוסף מכשיר", variant: "contained", disabled: update.isLoading }
    ]

    return (
        <GenericForm
            initInputs={initInputs}
            setInitInput={setInitInputs}
            fields={fields}
            onSubmit={(data) => update.mutate(data)}
        />
    )
}

export default AddOrEditDevice;