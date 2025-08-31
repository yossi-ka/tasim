import React from "react";
import { useQuery, useQueryClient } from "react-query";
import VisibilityIcon from '@mui/icons-material/Visibility';

import { search } from "../../utils/search"
import GenericTable from "../../components/GenericTable";
import { getAllInvoices } from "../../api/services/invoices";
import Context from "../../context";
import AddOrShow from "./AddOrShow";
import useTerms from "../../terms";
import Search from "./Search";

const Invoices = () => {
    const { getLookupName, snackbar, popup, user, confirm } = React.useContext(Context);

    const queryClient = useQueryClient();

    const [params, setParams] = React.useState({})
    const [filterdData, setFilterdData] = React.useState([])

    const term = useTerms("invoices")
    const [viewColumn, setViewColumn] = React.useState(term.getTerms().map(t => t.name));

    const { data, status, refetch } = useQuery("invoices", getAllInvoices)

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
                    icon: <VisibilityIcon color='primary' />,
                    label: "צפיה",
                    onClick: ({ row }) => popup({
                        title: 'צפיה בחשבונית',
                        content: <AddOrShow 
                            row={row} 
                            refetch={refreshAll}
                        />,
                    })
                }
            ]
        },
        ...term.table(viewColumn),
    ]

    return (
        <GenericTable
            counter={(status == "success" && Array.isArray(filterdData)) ? filterdData.length : 0}
            title={"חשבוניות"}
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

export default Invoices;