import React from 'react';
import useTerms from '../../../terms';
import { useMutation } from 'react-query';
import { addCity, updateCity } from '../../../api/services/cities';
import Context from '../../../context';
import GenericForm from '../../../components/GenericForm';

const AddOrUpdate = ({ row, refetch }) => {
    const { user, snackbar, closePopup, getLookup } = React.useContext(Context);
    const [initInputs, setInitInputs] = React.useState(row || {});

    const term = useTerms("updateCity");

    const update = useMutation(obj => row ? updateCity(row.id, obj, user.id) : addCity(obj, user.id), {
        onSuccess: (data) => {
            closePopup();
            snackbar("עדכון בוצע בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            console.error("Error updating city:", error);
            snackbar("עדכון נכשל", "error");
        }
    });

    const fields = [
        term.field("country", { variant: "outlined", size: 6, required: true }),
        term.field("name", { variant: "outlined", size: 6, required: true }),
        term.field("note", { variant: "outlined" }),
        { type: 'submit', label: row ? "עדכן עיר" : "הוסף עיר", variant: "contained", }
    ]

    console.log(getLookup("GlobalCountries"), "-----");

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
