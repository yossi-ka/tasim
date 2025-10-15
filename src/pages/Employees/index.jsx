import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import Context from "../../context";
import useTerms from "../../terms";
import Search from "./Search";
import AddOrUpdate from "./AddOrUpdate";
import { useQuery, useQueryClient } from "react-query";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getAllemployees } from "../../api/services/employees";


const Employees = () => {

    const { popup, smallPopup, getLookupName } = React.useContext(Context)

    const queryClient = useQueryClient();

    const terms = useTerms("employeesTable");
    const [params, setParams] = React.useState({})
    const [filterdData, setFilterdData] = React.useState([])

    const { data, status, refetch } = useQuery("employeesTable", () => getAllemployees())

    React.useEffect(() => {
        if (Object.keys(params).length === 0) return setFilterdData(data)
        search({
            params, data, setData: setFilterdData, getLookupName, terms: [...terms.terms,]
        })
    }, [params, data]);

    const refetchAll = () => {
        refetch();
        // queryClient.invalidateQueries(['sapakimTashlumim']);
    }

    const columns = [
        {
            iconBtn: <EditIcon />,
            onClick: (row) => popup({
                title: "עריכת עובד",
                content: <AddOrUpdate row={row} refetch={refetchAll} />,

            })
        },
        ...terms.table()

    ]

    return (
        <GenericTable
            height="main"
            data={status == "loading" ? [] : filterdData}
            columns={columns}
            loading={status == "loading"}
            title="עובדים"
            header={<Search
                params={params}
                setParams={setParams}
                refetch={refetchAll}
            />}
        />
    )
}

export default Employees;

//test

