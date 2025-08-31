import React from "react";
import { useQuery, useQueryClient } from "react-query";
import EditIcon from '@mui/icons-material/Edit';

import { search } from "../../../utils/search"
import GenericTable from "../../../components/GenericTable";
import { getCities } from "../../../api/services/cities";
import Context from "../../../context";
import AddOrUpdate from "./AddOrUpdate";
import useTerms from "../../../terms";
import Search from "./Search";

const Cities = () => {
    const { getLookupName, snackbar, popup, user } = React.useContext(Context);

    const queryClient = useQueryClient();

    const [params, setParams] = React.useState({})
    const [filterdData, setFilterdData] = React.useState([])

    const term = useTerms("cities")
    const [viewColumn, setViewColumn] = React.useState(term.getTerms().map(t => t.name));

    const { data, status, refetch } = useQuery("cities", getCities)

    function refreshAll() {
        refetch();
        queryClient.invalidateQueries(['lookup']);
    }

    React.useEffect(() => {
        if (Object.keys(params).length === 0) return setFilterdData(data)
        search({
            params, data, setData: setFilterdData, getLookupName, terms: [...term.terms,]
        })
    }, [params, data]);

    const columns = [
        {
            actionBtn: [
                {
                    icon: <EditIcon color='primary' />,
                    label: "עריכה",
                    onClick: ({ row }) => popup({
                        title: 'עריכת פרטי עיר',
                        content: <AddOrUpdate row={row} refetch={refreshAll} />,
                    })
                },
            ]
        },
        ...term.table(viewColumn),
    ]

    return (
        <GenericTable
            counter={(status == "success" && Array.isArray(filterdData)) ? filterdData.length : 0}
            title={"ערים"}
            height="tabs"
            data={status == "success" ? filterdData : []}
            loading={status == "loading"}
            columns={columns}
            innerPagination
            header={<Search
                termsForExcel={term.excel(viewColumn)}
                dataForExcel={filterdData}
                terms={term}
                params={params}
                setParams={setParams}
                viewColumn={viewColumn}
                setViewColumn={setViewColumn}
                allColumns={term.getTerms()}
                refetch={refreshAll} />}
        />
    );
};

export default Cities;
