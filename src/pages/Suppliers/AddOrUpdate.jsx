import React from 'react';
import useTerms from '../../terms';
import { useMutation } from 'react-query';
import { addSupplier, updateSupplier } from '../../api/services/suppliers';
import Context from '../../context';
import GenericForm from '../../components/GenericForm';

const AddOrUpdate = ({ row, refetch }) => {
    const { user, snackbar, closePopup } = React.useContext(Context);
    const [initInputs, setInitInputs] = React.useState(row || {});

    const term = useTerms("updateSupplier");

    const update = useMutation(obj => row ? updateSupplier(row.id, obj, user.id) : addSupplier(obj, user.id), {
        onSuccess: (data) => {
            closePopup();
            snackbar("עדכון בוצע בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            console.error("Error updating supplier:", error);
            snackbar("עדכון נכשל", "error");
        }
    });

    const fields = [
        // term.field("supplierCode", { variant: "outlined", size: 6, required: true }),
        term.field("name", { variant: "outlined", size: 6, required: true }),
        term.field("contactPerson", { variant: "outlined", size: 6 }),
        term.field("phone", { variant: "outlined", size: 6 }),
        term.field("email", { variant: "outlined", size: 6 }),
        term.field("address", { variant: "outlined", size: 6 }),
        // term.field("paymentTerms", { variant: "outlined", size: 6 }),
        term.field("notes", { variant: "outlined", size: 6 }),
        { type: 'submit', label: row ? "עדכן ספק" : "הוסף ספק", variant: "contained", disabled: update.isLoading }
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

export default AddOrUpdate;
