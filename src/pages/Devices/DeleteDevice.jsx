import React from "react";
import { useMutation, useQuery } from "react-query";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Checkbox } from "@mui/material";

import Context from "../../context";
import useTerms from "../../terms";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getAllDevices, deleteDevice } from "../../api/services/devices";
import AddOrEditDevice from "./AddOrEdit";
import Search from "./Search";
import GenericForm from "../../components/GenericForm";

function DeleteDevice({ row, refetch }) {

    const { getLookupName, popup, confirm, snackbar, closePopup } = React.useContext(Context);

    const DeleteDevice = useMutation(row => deleteDevice(row.id), {
        onSuccess: (data) => {
            closePopup();
            snackbar("המכשיר נמחק בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            console.error("Error deleting device:", error);
            snackbar("מחיקת המכשיר נכשלה", "error");
        }
    });

    const fields = [
        { type: 'submit', label: "אישור", variant: "contained", size: 6 },
        { type: 'button', label: "ביטול", variant: "contained", size: 6 }
    ]

    return (
        <GenericForm
            title="מחיקת מכשיר"
            fields={fields}
            onSubmit={() => DeleteDevice.mutate(row)}
        />
    )
}

export default DeleteDevice