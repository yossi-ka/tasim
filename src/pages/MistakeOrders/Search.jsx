import React from "react";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';

import GlobalSearch from "../../global/GlobalSearch";
import Context from "../../context";
import AddOrEditMistakeOrder from "./AddOrEdit";
import MistakeTypesManager from "./MistakeTypesManager";

const Search = ({ refetch, params, setParams }) => {
    const { popup } = React.useContext(Context);

    return <GlobalSearch
        quickSearchFields={[
            { name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }
        ]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        actions={[
            {
                title: "הוספת פניה חדשה",
                icon: <AddIcon color='primary' />,
                onClick: () => popup({
                    title: "הוספת פניה לטעות בהזמנה",
                    content: <AddOrEditMistakeOrder refetch={refetch} />
                })
            },
            {
                title: "ניהול סוגי טעויות",
                icon: <SettingsIcon color='primary' />,
                onClick: () => popup({
                    title: "ניהול סוגי טעויות",
                    content: <MistakeTypesManager />
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