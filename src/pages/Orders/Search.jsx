import React from "react";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { exportExcel } from "../../utils/excel";
import { useMutation } from "react-query";
import { syncOrderNumbers } from "../../api/services/orders";

import GlobalSearch from "../../global/GlobalSearch";
import Context from "../../context";
import SyncStatus from "./SyncStatus";
import useTerms from "../../terms";
import { Stack, Typography } from "@mui/material";
import { formatCurrencyIL } from "../../utils/func";

const Search = ({ refetch, params, setParams, dataForExcel, termForExcel, selected }) => {
    const { popup, convertArray, user, snackbar } = React.useContext(Context);

    const searchTerm = useTerms("ordersSearch");

    // מיוטיישן לסנכרון מספרים
    const syncNumbersMutation = useMutation(
        () => syncOrderNumbers(user.id),
        {
            onSuccess: (data) => {
                snackbar("עדכון מספרי הזמנה בוצע בהצלחה", 'success');
                refetch(); // רענון הנתונים לאחר הצלחה
            },
            onError: (error) => {
                snackbar(error.message || 'שגיאה בסנכרון מספרים', 'error');
            }
        }
    );

    const fields = [
        searchTerm.field("startdeliveryIndex", { variant: "outlined", size: 2 }),
        searchTerm.field("enddeliveryIndex", { variant: "outlined", size: 2 }),
        { type: "empty" },
        searchTerm.field("startnbsOrderId", { variant: "outlined", size: 2 }),
        searchTerm.field("endnbsOrderId", { variant: "outlined", size: 2 }),
        { type: "empty" },
        searchTerm.field("starttotalPrice", { variant: "outlined", size: 2 }),
        searchTerm.field("endtotalPrice", { variant: "outlined", size: 2 }),
    ]

    const amountTotalPrice = React.useMemo(() => {
        if (!selected || selected.length === 0) return 0;
        return selected.reduce((acc, item) => {
            return acc + (item.totalPrice || 0);
        }, 0);
    }, [selected]);

    return <GlobalSearch
        quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        fields={fields}
        header={amountTotalPrice > 0 && <Stack >
            <Typography variant="body2" color="primary.main" sx={{}}>סך לתשלום: <b>{formatCurrencyIL(amountTotalPrice)}</b></Typography>
            {/* <Typography variant="body2" sx={{}}>סך לתשלום: <strong>12,522</strong></Typography>
            <Typography variant="body2" sx={{}}>סך לתשלום: <strong>12,522</strong></Typography> */}
        </Stack>}
        actions={[
            {
                title: "סטטוס סנכרון",
                icon: <SyncIcon color='primary' />,
                onClick: () => popup({
                    title: "סטטוס סנכרון הזמנות",
                    content: <SyncStatus refetch={refetch} />
                })
            },
            {
                title: "סנכרון מספרים",
                icon: <FormatListNumberedIcon color='primary' />,
                onClick: () => {
                    syncNumbersMutation.mutate();
                },
                loading: syncNumbersMutation.isLoading
            },
            {
                title: "רענן מסך",
                icon: <RefreshIcon color='primary' />,
                onClick: () => {
                    refetch();
                }
            },
            {
                title: "הפקת אקסל",
                icon: <FileDownloadIcon color="primary" />,
                onClick: () => {
                    exportExcel(convertArray(dataForExcel, termForExcel), "הזמנות", termForExcel)
                }
            },
        ]}
        term="ordersSearch"
    />
}

export default Search;
