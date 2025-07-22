import React from "react";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';

import GlobalSearch from "../../global/GlobalSearch";
import Context from "../../context";
import SyncStatus from "./SyncStatus";
import useTerms from "../../terms";

const Search = ({ refetch, params, setParams }) => {
    const { popup, smallPopup } = React.useContext(Context);


    const searchTerm = useTerms("ordersSearch");

    const fields = [
        searchTerm.field("startdeliveryIndex", { variant: "outlined", size: 2 }),
        searchTerm.field("enddeliveryIndex", { variant: "outlined", size: 2 }),
        {type:"empty"},
        searchTerm.field("startnbsOrderId", { variant: "outlined", size: 2 }),
        searchTerm.field("endnbsOrderId", { variant: "outlined", size: 2 }),
    ]
    return <GlobalSearch
        quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        fields={fields}
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
                title: "רענן מסך",
                icon: <RefreshIcon color='primary' />,
                onClick: () => {
                    refetch();
                }
            }
        ]}
        term="ordersSearch"
    />
}

export default Search;
