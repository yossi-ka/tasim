import React from "react";
import RefreshIcon from '@mui/icons-material/Refresh';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import GlobalSearch from "../../global/GlobalSearch";
import Context from "../../context";
import UploadExcel from "./UploadExcel";

const Search = ({ refetch, params, setParams }) => {
    const { popup } = React.useContext(Context);
    return <GlobalSearch
        quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        actions={[
            {
                title: "הוספת לקוחות",
                icon: <FileUploadIcon color='primary' />,
                onClick: () => popup({
                    title: "הוספת לקוחות",
                    content: <UploadExcel refetch={refetch} />,
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
