import React from "react";
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

import Context from "../../context";
import GlobalSearch from "../../global/GlobalSearch";
import AddOrEditDevice from "./AddOrEdit";

const Search = ({ params, setParams, refetch, selected }) => {
    const { popup } = React.useContext(Context);

    return <GlobalSearch
        quickSearchFields={[
            { name: 'globalSearch', label: 'חיפוש מכשירים', size: 12, variant: "outlined" }
        ]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        actions={[
            {
                title: "הוסף מכשיר חדש",
                icon: <AddIcon color='primary' />,
                onClick: () => popup({
                    title: "הוסף מכשיר חדש",
                    content: <AddOrEditDevice refetch={refetch} />,
                })
            },
            {
                title: "רענן נתונים",
                icon: <RefreshIcon color='primary' />,
                onClick: refetch
            }
        ]}
    />;
};

export default Search;