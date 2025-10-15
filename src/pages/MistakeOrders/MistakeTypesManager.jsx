import React from "react";
import { useMutation } from "react-query";
import { Box, Typography, Button, Stack, List, ListItem, ListItemText, IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import Context from "../../context";
import useTerms from "../../terms";
import GenericForm from "../../components/GenericForm";
import {
    getAllMistakeOrderTypes,
    addMistakeOrderType,
    updateMistakeOrderType
} from "../../api/services/mistakeOrders";
import { useQuery } from "react-query";

const MistakeTypesManager = ({ onClose }) => {
    const { smallPopup, closeSmallPopup, snackbar, user, confirm } = React.useContext(Context);
    const terms = useTerms("mistakeOrderType");

    const { data: mistakeTypes = [], refetch } = useQuery("mistakeOrderTypes", getAllMistakeOrderTypes);

    const addTypeMutation = useMutation(
        (data) => addMistakeOrderType(data, user.id),
        {
            onSuccess: () => {
                snackbar("סוג הטעות נוסף בהצלחה", "success");
                refetch();
            },
            onError: () => {
                snackbar("שגיאה בהוספת סוג הטעות", "error");
            }
        }
    );

    const updateTypeMutation = useMutation(
        ({ id, data }) => updateMistakeOrderType(id, data, user.id),
        {
            onSuccess: () => {
                snackbar("סוג הטעות עודכן בהצלחה", "success");
                refetch();
            },
            onError: () => {
                snackbar("שגיאה בעדכון סוג הטעות", "error");
            }
        }
    );

    const handleAdd = () => {
        smallPopup({
            title: "הוספת סוג טעות חדש",
            content: (
                <GenericForm
                    fields={terms.getTerms().map(field => ({
                        ...field,
                        required: field.name === 'name' ? true : field.required
                    }))}
                    initInputs={{ name: "" }}
                    onSubmit={(data) => {
                        addTypeMutation.mutate(data);
                        closeSmallPopup();
                    }}
                    submitText="הוסף"
                />
            )
        });
    };

    const handleEdit = (mistakeType) => {
        smallPopup({
            title: "עריכת סוג טעות",
            content: (
                <GenericForm
                    fields={terms.getTerms().map(field => ({
                        ...field,
                        required: field.name === 'name' ? true : field.required
                    }))}
                    initInputs={{ name: mistakeType.name }}
                    onSubmit={(data) => {
                        updateTypeMutation.mutate({ id: mistakeType.id, data });
                        closeSmallPopup();
                    }}
                    submitText="עדכן"
                />
            )
        });
    };

    return (
        <Box sx={{ p: 2, minWidth: 400 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">ניהול סוגי טעויות</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAdd}
                >
                    הוסף סוג טעות
                </Button>
            </Stack>

            <List>
                {mistakeTypes.map((mistakeType) => (
                    <ListItem
                        key={mistakeType.id}
                        secondaryAction={
                            <Stack direction="row" spacing={1}>
                                <IconButton onClick={() => handleEdit(mistakeType)}>
                                    <EditIcon />
                                </IconButton>
                            </Stack>
                        }
                    >
                        <ListItemText primary={mistakeType.name} />
                    </ListItem>
                ))}
            </List>

            {mistakeTypes.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    אין סוגי טעויות מוגדרים
                </Typography>
            )}
        </Box>
    );
};

export default MistakeTypesManager;