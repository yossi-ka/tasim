import React from "react";
import AddIcon from "@mui/icons-material/Add";
import GlobalSearch from "../../global/GlobalSearch";
import Context from "../../context";
import AddOrUpdate from "./AddOrUpdate";

const Search = ({ refetch, params, setParams }) => {
    const { popup, smallPopup } = React.useContext(Context);
    return <GlobalSearch
        quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        actions={[{
            title: "הוספת עובד למערכת",
            icon: <AddIcon color='primary' />,
            onClick: () => popup({
                title: "הוספת עובד למערכת",
                content: <AddOrUpdate refetch={refetch} />,
            })
        },]}
    />
}

export default Search;
