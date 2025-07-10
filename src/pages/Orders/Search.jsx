import React from "react";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';

import GlobalSearch from "../../global/GlobalSearch";
import Context from "../../context";
import AddOrUpdate from "./AddOrUpdate";
import SyncStatus from "./SyncStatus";
import { moveAllOrdersFrom4To5 } from "../../api/services/collectionGroups";

const Search = ({ refetch, params, setParams }) => {
    const { popup, smallPopup } = React.useContext(Context);

    return <GlobalSearch
        quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
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
            },
            {
                title: "רענן מגדגדגדגסך",
                icon: <RefreshIcon color='primary' />,
                onClick: async () => {
                    await moveAllOrdersFrom4To5();
                }
            },
        ]}
    />
}

export default Search;
