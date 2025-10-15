import React from "react";
import RefreshIcon from '@mui/icons-material/Refresh';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import GlobalSearch from "../../global/GlobalSearch";
import Context from "../../context";
import UploadExcel from "./UploadExcel";
import useTerms from "../../terms";

const Search = ({ refetch, params, setParams }) => {
    const { popup } = React.useContext(Context);

    const searchTerm = useTerms("customersSearch");

    const fields = [
        searchTerm.field("startdeliveryIndex", { variant: "outlined", size: 2 }),
        searchTerm.field("enddeliveryIndex", { variant: "outlined", size: 2 }),
    ]
    return <GlobalSearch
        quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        fields={fields}
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
        term="customersSearch"
    />
}

export default Search;
