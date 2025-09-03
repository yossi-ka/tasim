import React from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import GlobalSearch from "../../../global/GlobalSearch";
import { exportExcel } from '../../../utils/excel';
import Context from '../../../context';
import useTerms from '../../../terms';
import { Stack, Typography } from "@mui/material";
import { formatCurrencyIL } from "../../../utils/func";

const Search = ({ refetch, params, setParams, termForExcel, dataForExcel, selected }) => {

    const { convertArray } = React.useContext(Context);

    const searchTerm = useTerms("reportProductSearch");

    const fields = [
        searchTerm.field("startprofit", { variant: "outlined", size: 2 }),
        searchTerm.field("endprofit", { variant: "outlined", size: 2 }),
        { type: "empty" },
        searchTerm.field("startprofitPercentage", { variant: "outlined", size: 2 }),
        searchTerm.field("endprofitPercentage", { variant: "outlined", size: 2 }),
        { type: "empty" },
        searchTerm.field("startpaidAmount", { variant: "outlined", size: 2 }),
        searchTerm.field("endpaidAmount", { variant: "outlined", size: 2 }),
        { type: "empty" },
        searchTerm.field("startorderCount", { variant: "outlined", size: 2 }),
        searchTerm.field("endorderCount", { variant: "outlined", size: 2 }),
        { type: "empty" },
        searchTerm.field("startunitCount", { variant: "outlined", size: 2 }),
        searchTerm.field("endunitCount", { variant: "outlined", size: 2 }),
        { type: "empty" },
        searchTerm.field("startmissUnitCount", { variant: "outlined", size: 2 }),
        searchTerm.field("endmissUnitCount", { variant: "outlined", size: 2 }),
    ]

    const amountTotalProfit = React.useMemo(() => {
        if (!selected || selected.length === 0) return 0;
        return selected.reduce((acc, item) => {
            return acc + (item.profit || 0);
        }, 0);
    }, [selected]);

    const amountTotalRevenue = React.useMemo(() => {
        if (!selected || selected.length === 0) return 0;
        return selected.reduce((acc, item) => {
            return acc + (item.paidAmount || 0);
        }, 0);
    }, [selected]);

    return <>
        <GlobalSearch
            quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
            quickSearchOnTyping={true}
            params={params}
            setParams={setParams}
            fields={fields}
            header={selected && selected.length > 0 && (
                <Stack>
                    <Typography variant="body2" color="primary.main">
                        סך רווח: <b>{formatCurrencyIL(amountTotalProfit)}</b>
                    </Typography>
                    <Typography variant="body2" color="primary.main">
                        סך הכנסות: <b>{formatCurrencyIL(amountTotalRevenue)}</b>
                    </Typography>
                </Stack>
            )}
            actions={[
                // {
                //     title: "איפוס טווח תאריכים",
                //     icon: <EventBusyIcon color='primary' />,
                //     onClick: () => setDateRange({ startDate: null, endDate: null })
                // },
                {
                    title: "רענן מסך",
                    icon: <RefreshIcon color='primary' />,
                    onClick: () => {
                        refetch();
                    }
                },
                // {
                //     title: "בחירת עמודות",
                //     icon: <ViewColumnIcon color="primary" />,
                //     onClick: (e) => {
                //         handleColumnPopover(e)
                //     }
                // },
                {
                    title: "הפקת אקסל",
                    icon: <FileDownloadIcon color="primary" />,
                    onClick: () => {
                        exportExcel(convertArray(dataForExcel, termForExcel), "דו''ח לפי תאריך", termForExcel)
                    }
                },
            ]}
            term="reportProductSearch"
        />
    </>
}

export default Search;
