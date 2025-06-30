import React from "react";
import useTerms from "../../../terms";
import GenericForm from "../../../components/GenericForm";
import { findOrCreateConversation } from "../../../api/services/conversations";
import { useMutation, useQueryClient } from "react-query";
import Context from "../../../context";

const AddContacts = ({ refetch, onContactSelect }) => {

    const { snackbar, closePopup } = React.useContext(Context);
    const queryClient = useQueryClient();

    const term = useTerms("addContacts");


    const createConversationMutation = useMutation(
        ({ phone, customerName }) => findOrCreateConversation("", phone, customerName),
        {
            onSuccess: (newConversation) => {
                // עדכון הקאש
                queryClient.invalidateQueries("allConversations");
                queryClient.invalidateQueries("pendingConversations");

                // בחירת השיחה החדשה
                onContactSelect(newConversation.id);

                snackbar("איש קשר חדש נוסף בהצלחה!", "success");
                // refetch();
                closePopup();

            },
            onError: (error) => {
                console.error('Error creating conversation:', error);
                snackbar("שגיאה ביצירת איש קשר: " + error.message, "error");
            }
        }
    );
    const handleCreateConversation = (inputs) => {
        if (!inputs.phone.trim()) {
            snackbar("יש להזין מספר טלפון", "warning");
            return;
        }

        // ולידציה בסיסית של מספר טלפון
        const phoneRegex = /^[\d\-\s\+\(\)]+$/;
        if (!phoneRegex.test(inputs.phone.trim())) {
            snackbar("מספר הטלפון אינו תקין", "warning");
            return;
        }

        createConversationMutation.mutate({
            phone: inputs.phone.trim(),
            customerName: inputs.customerName.trim() || ``
        });
    };

    const fields = [
        term.field("phone", { variant: "outlined", size: 5 }),
        term.field("customerName", { variant: "outlined", size: 7 }),

        {
            type: 'submit',
            disabled: createConversationMutation.isLoading,
            variant: "contained", color: "primary",
            label: "הוסף איש קשר"
        },

    ]

    return <GenericForm
        fields={fields}
        onSubmit={handleCreateConversation}
    />
}

export default AddContacts;
