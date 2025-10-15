import React from "react";
import { useQuery } from "react-query";
import EditIcon from '@mui/icons-material/Edit';

import Context from "../../context";
import useTerms from "../../terms";
import Search from "./Search";
import AddOrEditRouteOrder from "./AddOrEdit";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getAllRouteOrders } from "../../api/services/routeOrders";

const RouteOrders = () => {

    const { getLookupName, popup } = React.useContext(Context)

    const terms = useTerms("routeOrdersTable");
    const [params, setParams] = React.useState({})
    const [filterdData, setFilterdData] = React.useState([])

    const { data, status, refetch } = useQuery("routeOrdersTable", getAllRouteOrders, {
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
        {
            actionBtn: [
                {
                    icon: <EditIcon color='primary' />,
                    onClick: ({ row }) => popup({
                        title: "עריכת סדר מסלול",
                        content: <AddOrEditRouteOrder row={row} refetch={refetchAll} />,
                    })
                }
            ]
        },
        ...terms.table(),
    ]

    return (
        <GenericTable
            height="main"
            data={status == "loading" ? [] : filterdData}
            columns={columns}
            loading={status == "loading"}
            title="סדר מסלולים"
            header={<Search
                params={params}
                setParams={setParams}
                refetch={refetchAll}
            />}
            innerPagination
        />
    )
}

export default RouteOrders;
