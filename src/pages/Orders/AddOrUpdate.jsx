import React from "react";
import { useMutation, useQuery } from "react-query";
import GenericForm from "../../components/GenericForm";
import useTerms from "../../terms";
import Context from "../../context";
import { addEmployee, updateEmployee } from "../../api/services/employees";


const AddOrUpdate = ({ row, refetch }) => {
    const { closePopup, user, snackbar } = React.useContext(Context);
    const [initInputs, setInitInputs] = React.useState({});

    React.useEffect(() => {
        if (row) {
            setInitInputs(row);
        }
    }, [row]);


    const update = useMutation(obj => row?.id ? updateEmployee(row.id, obj, user.id) : addEmployee(obj, user.id), {
        onSuccess: (data) => {
            closePopup();
            snackbar("עדכון בוצע בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            console.error("Error updating sherut:", error);
            snackbar("עדכון נכשל", "error");
        }
    });



    const term = useTerms("employeesUpdate");

    const fields = [

        term.field("firstName", { variant: "outlined", size: 4, required: true }),
        term.field("lastName", { variant: "outlined", size: 4, required: true }),
        term.field("phone", { variant: "outlined", size: 4 }),

        { type: "line", "label": "פרטי התחברות למערכת" },
        term.field("username", { variant: "outlined", size: 4 }),
        term.field("password", { variant: "outlined", size: 4 }),
        term.field("cardNumber", { variant: "outlined", size: 4 }),

        term.field("isActive", { variant: "outlined", size: 4, displayConditionGrid: () => row ? true : false }),

        {
            type: "submit",
            label: row ? "עדכון עובד" : "הוספת עובד",
            variant: "contained",
            disabled: update.isLoading,
        }


    ];
    return <GenericForm
        initInputs={initInputs}
        setInitInput={setInitInputs}
        fields={fields}
        onSubmit={(data) => {

            update.mutate(data)
        }}
    />
};
export default AddOrUpdate;
