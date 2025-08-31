import React from "react";
import useTerms from "../../terms";
import GenericForm from "../../components/GenericForm";
import { useMutation } from "react-query";
import { checkProductPlace, updateProduct } from "../../api/services/products";
import Context from "../../context";
import { Alert, AlertTitle } from "@mui/material";

const AddOrEdit = ({ row, refetch }) => {

    const { user, snackbar, closePopup } = React.useContext(Context)
    const [initInputs, setInitInputs] = React.useState(row || {});
    const [productInPlace, setProductInPlace] = React.useState(null);

    const term = useTerms("updateProduct")

    const update = useMutation(data => updateProduct(row.id, data, user.id), {
        onSuccess: () => {
            snackbar("עדכון בוצע בהצלחה")
            closePopup()
            refetch()
        },
        onError: (err) => {
            snackbar("שגיאה בעדכון המידע")
        }
    })

    const checkPlace = useMutation(data => checkProductPlace(row.id, data), {
        onSuccess: (data) => {
            setProductInPlace(data);
        },
        onError: (err) => {
            snackbar("שגיאה במיקום המוצר")
        }
    })

    React.useEffect(() => {
        if (initInputs.productPlace) {
            console.log("Checking product place:", initInputs.productPlace);
            checkPlace.mutate(initInputs.productPlace);
        }
    }, [initInputs.productPlace]);

    const fields = [
        { type: 'line', label: "פרטים כללים - ממערכת NBS" },
        term.field("name", { variant: "outlined", disabled: true, size: 4.5 }),
        term.field("nbsProductId", { variant: "outlined", disabled: true, size: 2.5 }),
        term.field("price", { variant: "outlined", disabled: true, size: 2.5 }),
        term.field("nbsStatus", { variant: "outlined", disabled: true, size: 2.5 }),


        { type: 'line', label: "פרטים נוספים" },
        term.field("productPlace", { variant: "outlined", size: 4 }),
        term.field("sku", { variant: "outlined", size: 8 }),
        term.field("isQuantityForShipping", { variant: "outlined", size: 6 }),
        term.field("categories", { variant: "outlined", size: 6 }),

        { type: 'line', label: "" },
        term.field("quantity", { variant: "outlined", size: 4 }),
        term.field("manufacturer", { variant: "outlined", size: 4 }),
        term.field("hashgacha", { variant: "outlined", size: 4 }),


        {
            cb: () => <Alert severity="error">
                <AlertTitle>מוצר כבר קיים במקום זה</AlertTitle>
                {productInPlace?.name || ""}
            </Alert>,
            displayConditionGrid: () => !!productInPlace
        },
        { type: 'submit', label: "שמור", variant: "contained", disabled: update.isLoading || checkPlace.isLoading || productInPlace != null }
    ]
    return (
        <GenericForm
            fields={fields}
            initInputs={initInputs}
            setInitInput={setInitInputs}
            onSubmit={(data) => {
                const obj = {
                    productPlace: data.productPlace || 0,
                    sku: data.sku || "",
                    isQuantityForShipping: data.isQuantityForShipping || false,
                    categories: data.categories || [],
                    quantity: data.quantity || "",
                    manufacturer: data.manufacturer || "",
                    hashgacha: data.hashgacha || ""
                };

                update.mutate(obj);
            }}
        />
    );
};

export default AddOrEdit;
