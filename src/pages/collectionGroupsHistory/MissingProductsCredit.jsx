import React from 'react';
import { useMutation, useQuery } from 'react-query';
import { Alert, IconButton, Stack, Switch, Tooltip, Typography, Box } from '@mui/material';
import AddCardIcon from '@mui/icons-material/AddCard';
import { getMissingProductsByOrder } from '../../api/services/collectionGroups';
import GenericTable from '../../components/GenericTable';
import useTerms from '../../terms';
import Context from '../../context';
import { updateOrder } from '../../api/services/orders';

const MissingProductsCredit = ({ collectionGroupId }) => {

    const { confirm, user, snackbar } = React.useContext(Context)

    const { data, isLoading, refetch } = useQuery(
        ["getMissingProductsByOrder", collectionGroupId],
        () => getMissingProductsByOrder(collectionGroupId)
    );

    const update = useMutation(data => updateOrder(data.id, { isCreditDone: data.isCreditDone }, user.id), {
        onSuccess: () => {
            snackbar("החשבון עודכן בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            console.error("Error updating order:", error);
            snackbar("החשבון לא עודכן", "error");
        }
    });

    const term = useTerms("MissingProductsCredit");

    const columns = [
        ...term.table(),
        {
            label: "בוצע זיכוי?",
            cb: (row) => <Switch
                checked={row.isCreditDone ? true : false}
                onChange={(e) => {
                    confirm({
                        message: `האם אתה בטוח שאתה רוצה לסמן את ההזמנה הזו כ${e.target.checked ? "זוכה" : "לא זוכה"} ?`,
                        onConfirm: async () => {
                            console.log(e, "e")
                            update.mutate({ id: row.id, isCreditDone: !e.target.checked });
                        }
                    })
                }}
            />,
        },
        {
            cb: (row) => <Tooltip title="ביצוע זיכוי" arrow>
                <IconButton
                    onClick={() => {
                        //open a new tab
                        window.open(`https://sales-v2.nbs-app.net/order/${row.nbsOrderId}/detail/`, '_blank');
                    }}
                    size="small"
                    sx={{
                        color: '#2e7d32',
                        width: 28,
                        height: 28,
                        '&:hover': {
                            backgroundColor: '#2e7d3220',
                            transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s ease'
                    }}
                >
                    <AddCardIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        }
    ]

    // חישוב סטטיסטיקות זיכוי
    const creditStats = React.useMemo(() => {
        const completedCredits = data?.filter(item => item.isCreditDone).length || 0;
        const totalCredits = data?.length || 0;
        const completionPercentage = totalCredits > 0 ? Math.round((completedCredits / totalCredits) * 100) : 0;

        return {
            completedCredits,
            totalCredits,
            completionPercentage
        };
    }, [data]);

    return (
        <Stack direction="column" spacing={2} sx={{ padding: 2 }}>
            <Alert severity="info">שים לב לאחר שמזכים את החשבון לסמן במערכת בוצע זיכוי</Alert>
            <Box sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1">
                        <strong>{creditStats.completedCredits}</strong> מתוך <strong>{creditStats.totalCredits}</strong> בוצעו
                    </Typography>

                </Box>
            </Box>

            <GenericTable
                customHeight={{
                    container: "500px",
                    tableContent: 1
                }}
                data={data}
                isLoading={isLoading}
                columns={columns}
            />
        </Stack>
    );
};

export default MissingProductsCredit;
