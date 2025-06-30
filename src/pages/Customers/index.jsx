import React from "react";

import Context from "../../context";
import useTerms from "../../terms";
import Search from "./Search";
import { useQuery } from "react-query";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getAllCustomers } from "../../api/services/customers";

const Customers = () => {

    const { getLookupName } = React.useContext(Context)

    const terms = useTerms("customersTable");
    const [params, setParams] = React.useState({})
    const [filterdData, setFilterdData] = React.useState([])

    const { data, status, refetch } = useQuery("customersTable", getAllCustomers, {
        refetchOnWindowFocus: false,
    })

    React.useEffect(() => {
        if (Object.keys(params).length === 0) return setFilterdData(data)
        search({
            params, data, setData: setFilterdData, getLookupName, terms: [...terms.terms,]
        })
    }, [params, data]);

    const refetchAll = () => {
        refetch();
    }

    const columns = [
        ...terms.table(),
    ]

    return (
        <GenericTable
            height="main"
            data={status == "loading" ? [] : filterdData}
            columns={columns}
            loading={status == "loading"}
            title="לקוחות"
            header={<Search
                params={params}
                setParams={setParams}
                refetch={refetchAll}
            />}
            innerPagination
        />
    )
}

export default Customers;
