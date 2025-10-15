import React from "react";
import GenericForm from "../../components/GenericForm";
import Context from "../../context";
import { useMutation } from "react-query";
import { updateCategories, updateIsQuantityForShipping } from "../../api/services/products";

const ManageCategories = ({ rows, refetch }) => {

    const { closePopup, snackbar, user } = React.useContext(Context);
    const [initInputs, setInitInputs] = React.useState({ type: "add" });

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

    const updateQuantityForShipping = useMutation(data => updateIsQuantityForShipping(ids, data.isQuantityForShipping, user.id), {
        onSuccess: () => {
            closePopup();
            snackbar("הכמות למשלוח עודכנה בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            console.error(error);
            snackbar(`שגיאה בעדכון הכמות למשלוח: ${error.message}`, "error");
        }
    });

    return <GenericForm
        initInputs={initInputs}
        setInitInput={setInitInputs}
        fields={[
            {
                name: "type",
                type: "select",
                label: "פעולה",
                options: [
                    { label: "הוספה", value: "add" },
                    { label: "הסרה", value: "remove" },
                    { label: "הגדרת מוצר עם כמות למשלוח", value: "setQuantityForShipping" },
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
                size: 4,
                displayConditionGrid: () => initInputs.type !== "setQuantityForShipping",
            },
            {
                name: "isQuantityForShipping",
                type: "checkbox",
                label: "הגדרת כמות למשלוח?",
                size: 4,
                displayConditionGrid: () => initInputs.type == "setQuantityForShipping",
            },
            { type: "submit", label: "שמור", size: 4, variant: "contained" }
        ]}

        onSubmit={(data) => {
            if (data.type === "setQuantityForShipping") {
                updateQuantityForShipping.mutate(data);
            } else {
                update.mutate(data);
            }
        }}
    />

}

export default ManageCategories;