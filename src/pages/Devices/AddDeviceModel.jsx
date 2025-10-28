import React from "react";
import { useMutation } from "react-query";

import Context from "../../context";
import useTerms from "../../terms";
import GenericForm from "../../components/GenericForm";
import { addDeviceModel } from "../../api/services/devices";

const AddOrEditDevice = () => {
    const { user, snackbar, closePopup } = React.useContext(Context);
    const [initInputs, setInitInputs] = React.useState({});

    const term = useTerms("addDeviceModel");

    const update = useMutation(obj => addDeviceModel(obj, user.id), {
        onSuccess: (data) => {
            closePopup();
            snackbar("דגם חדש נוסף בהצלחה", "success");
            window.location.reload();
        },
        onError: (error) => {
            console.error("Error updating new device model:", error);
            snackbar("עדכון נכשל", "error");
        }
    });

    const fields = [
        term.field("name", { variant: "outlined", size: 12, required: true }),
        term.field("worksIn", { variant: "outlined", size: 12 }),

        { type: 'submit', label: "הוסף דגם חדש", variant: "contained", disabled: update.isLoading }
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