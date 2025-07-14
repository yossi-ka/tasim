import React from "react";
import GenericForm from "../../components/GenericForm";
import Context from "../../context";
import { useMutation } from "react-query";
import { updateCategories } from "../../api/services/products";

const ManageCategories = ({ rows, refetch }) => {

    const { closePopup, snackbar, user } = React.useContext(Context);

    const ids = React.useMemo(() => {
        return rows.map(r => r.id);
    }, [rows]);

    const update = useMutation(data => updateCategories(ids, data.category, data.type, user.id), {
        onSuccess: () => {
            closePopup();
            snackbar("הקטגוריה עודכנה בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            console.error(error);
            snackbar(`שגיאה בעדכון הקטגוריה: ${error.message}`, "error");
        }
    });

    return <GenericForm
        initInputs={{ type: "add" }}
        fields={[
            {
                name: "type",
                type: "select",
                label: "פעולה",
                options: [
                    { label: "הוספה", value: "add" },
                    { label: "הסרה", value: "remove" },
                ],
                required: true,
                variant: "outlined",
                size: 4
            },
            {
                name: "category",
                type: "lookup",
                label: "קטגוריה",
                lookup: "globalProductCategories",
                required: true,
                variant: "outlined",
                size: 4
            },
            { type: "submit", label: "שמור", size: 4, variant: "contained" }
        ]}

        onSubmit={(data) => {
            update.mutate(data);
        }}
    />

}

export default ManageCategories;