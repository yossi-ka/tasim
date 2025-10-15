import React from "react";
import RefreshIcon from '@mui/icons-material/Refresh';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';

import GlobalSearch from "../../global/GlobalSearch";
import Context from "../../context";
import UploadRouteOrders from "./UploadExcel";
import AddOrEditRouteOrder from "./AddOrEdit";

const Search = ({ refetch, params, setParams }) => {
    const { popup } = React.useContext(Context);

    return <GlobalSearch
        quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        actions={[
            {
                title: "הוספת קובץ סדרי מסלולים",
                icon: <FileUploadIcon color='primary' />,
                onClick: () => popup({
                    title: "הוספת סדרי מסלולים",
                    content: <UploadRouteOrders refetch={refetch} />,
                })
            },
            {
                title: "הוספת בניין למסלול",
                icon: <AddIcon color='primary' />,
                onClick: () => popup({
                    title: "הוספת בניין למסלול",
                    content: <AddOrEditRouteOrder refetch={refetch} />,
                })
            },
            {
                title: "רענן מסך",
                icon: <RefreshIcon color='primary' />,
                onClick: () => {
                    refetch();
                }
            },
        ]}
    />
}

export default Search;
