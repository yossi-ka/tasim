import React from "react";
import {
    Box,
    Typography,
    Paper,
    CircularProgress,
    Button,
    Stack,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useMutation, useQueryClient } from "react-query";
import { completeCollectionGroup } from "../../../api/services/collectionGroups";
import Context from "../../../context";
import GenericForm from "../../../components/GenericForm";

const Completion = ({ currentCollectionGroup }) => {

    const { popup, user } = React.useContext(Context);

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', minHeight: '400px' }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                    סיום
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    סיכום וסיום התהליך
                </Typography>

                <Stack direction="column" spacing={2} sx={{ mt: 3, mb: 3, alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3 }}
                        onClick={() => popup({
                            title: "סגירת קבוצה",
                            content: <CompletedPopup currentCollectionGroup={currentCollectionGroup} />,
                        })}
                        startIcon={<CheckCircleIcon />}
                    >
                        {'סיום וסגירת ההזמנה'}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
};

export default Completion;

const CompletedPopup = ({ currentCollectionGroup }) => {

    const queryClient = useQueryClient();
    const { user, snackbar, closePopup } = React.useContext(Context);
    const completedGroup = useMutation((d) => completeCollectionGroup(currentCollectionGroup.id, user.id, d.employeeId), {
        onSuccess: (data) => {
            console.log("Collection group completed successfully:", data);
            snackbar("הקבוצה הושלמה בהצלחה", "success");
            queryClient.invalidateQueries("openCollectionGroups");
            closePopup();
        },
        onError: (error) => {
            console.error("Error completing collection group:", error);
            snackbar("שגיאה בהשלמת הקבוצה", "error");
        }
    });

    return (
        <Stack direction="column" spacing={2} sx={{ mt: 3, mb: 3 }}>
            <Typography variant="h4" color="primary.main">
                האם אתה בטוח שברצונך לסגור את הקבוצה?
            </Typography>
            <Typography variant="h6" color="text.secondary">
                סגירת הקבוצה תסיים את כל ההזמנות ותגדיר אותם במשלוח
            </Typography>
            <Typography variant="h6" color="text.secondary">
                בחר עובד שאחראי על המשלוחים
            </Typography>
            <GenericForm
                fields={[
                    {
                        name: "employeeId",
                        variant: "outlined",
                        size: 6,
                        label: "עובד",
                        type: "lookup",
                        lookup: "employeesActive",
                        required: true,
                    },
                    {
                        variant: "contained",
                        disabled: completedGroup.isLoading,
                        type: "submit",
                        size: 6,
                        label: "אישור סגירת הקבוצה",
                    }
                ]}
                onSubmit={(data) => {
                    const objToSend = {
                        employeeId: data.employeeId ? data.employeeId : null // אם יש עובד ליקוט,
                    }

                    completedGroup.mutate(objToSend);
                }}
            />
        </Stack>
    );
}
