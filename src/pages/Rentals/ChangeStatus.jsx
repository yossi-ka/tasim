import { Box } from "@mui/material";
import React from "react";
import Context from "../../context";
import GenericForm from "../../components/GenericForm";
import { useMutation } from "react-query";
import { updateRentals } from "../../api/services/rentals";

const ChangeStatus = ({ options, rows, refetch, status }) => {

    const { closePopup, user, snackbar } = React.useContext(Context);

    const [initInputs, setInitInputs] = React.useState({});

    const ids = React.useMemo(() => rows.map((row) => row.id), [rows]);

    const handleSubmit = useMutation((data) => updateRentals(ids, data, user.id), {
        onSuccess: () => {
            closePopup();
            snackbar("סטטוס עודכן בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            snackbar(error.message, "error");
        }
    });

    return (
        <GenericForm
            initInputs={initInputs}
            setInitInput={setInitInputs}
            fields={[
                {
                    name: "status",
                    variant: "outlined",
                    size: 12,
                    label: "העברה לסטטוס",
                    type: "select",
                    options: options,
                    required: true,
                },
                {
                    cb: () => <Box sx={{ h: 20 }}></Box>
                },
                {
                    variant: "contained",
                    disabled: handleSubmit.isLoading,
                    type: "submit",
                    size: 12,
                    label: "אישור שינוי סטטוס",
                }
            ]}
            onSubmit={(data) => {
                handleSubmit.mutate({ rentalStatus: data.status });
            }}
        />
    );
}

export default ChangeStatus;