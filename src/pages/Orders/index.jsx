import React from "react";
import EditIcon from "@mui/icons-material/Edit";
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import FireTruckIcon from '@mui/icons-material/FireTruck';
import HouseSidingIcon from '@mui/icons-material/HouseSiding';

import Context from "../../context";
import useTerms from "../../terms";
import Search from "./Search";
import AddOrUpdate from "./AddOrUpdate";
import { useQuery, useQueryClient } from "react-query";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getOrdersByStatus, getSummaryByStatus } from "../../api/services/orders";
import ChangeStatus from "./ChangeStatus";
import { Checkbox } from "@mui/material";


const Orders = () => {

    const { popup, smallPopup, getLookupName } = React.useContext(Context)

    const queryClient = useQueryClient();

    const terms = useTerms("ordersTable");
    const [params, setParams] = React.useState({})
    const [statusOrders, setStatusOrders] = React.useState("start");

    const [selected, setSelected] = React.useState([]);
    const [filterdData, setFilterdData] = React.useState([])
    const { data: calculateStatus, ...calc } = useQuery("calculateStatus", getSummaryByStatus, {
        refetchOnWindowFocus: false,
    })

    const statuses = React.useMemo(() => {
        return [

            { count: calculateStatus?.start, label: "ראשוני", color: "error", key: "start", id: 1 },
            { count: calculateStatus?.likut, label: "בליקוט", color: "warning", key: "likut", id: 2 },
            { count: calculateStatus?.kvitzatLikut, label: "בקבוצה", color: "warning", key: "kvitzatLikut", id: 6 },
            { count: calculateStatus?.mamtinLemishloach, label: "ממתין למשלוח", color: "primary", key: "mamtinLemishloach", id: 3 },
            { count: calculateStatus?.mishloach, label: "במשלוח", color: "info", key: "mishloach", id: 4 },
            { count: calculateStatus?.end, label: "הסתיים", color: "success", key: "end", id: 5 },
        ]
    }, [calculateStatus])

    const getStatusId = (key) => {
        const status = statuses.find((s) => s.key === key);
        return status ? status.id : null;
    }

    const { data, status, refetch } = useQuery(["ordersTable", getStatusId(statusOrders)],
     () => getOrdersByStatus(getStatusId(statusOrders)), {
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
        calc.refetch();
        // queryClient.invalidateQueries(['sapakimTashlumim']);
    }

    const filterdDataLength = React.useMemo(() => {
        if (status == "loading") return 0
        return data.length
    }, [data, status]);

    const isAllowChangeStatus = React.useMemo(() => [1, 2, 3, 4].includes(getStatusId(statusOrders)), [statusOrders]);

    const columns = [
        isAllowChangeStatus && {
            cb: (row) => <Checkbox
                checked={selected.some((r) => r.id === row.id)}
                onChange={(e) => {
                    if (e.target.checked) {
                        setSelected((prev) => [...prev, row]);
                    } else {
                        setSelected((prev) => prev.filter((r) => r.id !== row.id));
                    }

                }}
            />,
            label: <Checkbox
                checked={status != "loading" && selected.length === filterdDataLength}
                onChange={(e) => {
                    if (e.target.checked) {
                        setSelected(filterdData);
                    } else {
                        setSelected([]);
                    }
                }}
                indeterminate={selected.length > 0 && selected.length < filterdDataLength}
            />,
        },
        ...terms.table(null, {
            phone: { cb: (row) => row.phones.join(" | ") }
        }),
        isAllowChangeStatus && {
            actionBtn: ({ row }) => [
                {
                    icon: row.orderStatus == 1 ? <ShoppingCartCheckoutIcon color="primary" /> :
                        row.orderStatus == 2 ? <HourglassEmptyIcon color="primary" /> :
                            row.orderStatus == 3 ? <FireTruckIcon color="primary" /> :
                                row.orderStatus == 4 ? <HouseSidingIcon color="primary" /> : null,
                    onClick: () => popup({
                        title: "שינוי סטטוס הזמנה",
                        content: <ChangeStatus rows={[row]} refetch={refetchAll} status={row.orderStatus} />
                    }),
                    disabled: ![1, 2, 3, 4].includes(row.orderStatus),
                }
            ]
        }

    ]

    return (
        <GenericTable
            height="main"
            data={status == "loading" ? [] : filterdData}
            columns={columns}
            loading={status == "loading"}
            title="הזמנות"
            header={<Search
                params={params}
                setParams={setParams}
                refetch={refetchAll}
                dataForExcel={filterdData}
                termForExcel={terms.getTerms()}
                selected={selected}
            />}
            innerPagination

            actions={selected.length > 0 ? [
                {
                    label: `שינוי סטטוס ל ${selected.length} הזמנות`,
                    onClick: () => popup({
                        title: "שנה סטטוס הזמנות",
                        content: <ChangeStatus
                            status={getStatusId(statusOrders)}
                            rows={selected}
                            refetch={() => {
                                refetchAll();
                                setSelected([])
                            }} />
                    }),
                    count: selected.length,
                }
            ] : null}
            statuses={statuses}
            statusBarHandleChange={(index, key) => {
                setSelected([]);
                setStatusOrders(key)
            }}
        />
    )
}

export default Orders;

//test

