import React from "react";
import { useQuery } from "react-query";
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import { Checkbox } from "@mui/material";

import Context from "../../context";
import useTerms from "../../terms";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getAllMistakeOrders } from "../../api/services/mistakeOrders";
import AddOrEditMistakeOrder from "./AddOrEdit";
import Search from "./Search";
import ChangeMistakeOrderStatus from "./ChangeStatus";

const MistakeOrders = () => {
    const { getLookupName, popup } = React.useContext(Context);

    const terms = useTerms("mistakeOrdersTable");
    const [params, setParams] = React.useState({});
    const [filteredData, setFilteredData] = React.useState([]);
    const [selected, setSelected] = React.useState([]);

    // מיפוי סטטוסים לטקסט
    const getStatusName = React.useCallback((status) => {
        // המרה למספר אם זה מחרוזת
        const statusNum = Number(status);

        switch (statusNum) {
            case 1:
                return "חדש";
            case 2:
                return "בטיפול";
            case 3:
                return "סגור";
            default:
                return "לא ידוע";
        }
    }, []);

    const { data, status, refetch } = useQuery("mistakeOrders", getAllMistakeOrders, {
        refetchOnWindowFocus: false,
    });

    React.useEffect(() => {
        if (Object.keys(params).length === 0) return setFilteredData(data || []);
        search({
            params,
            data,
            setData: setFilteredData,
            getLookupName,
            terms: [...terms.terms]
        });
    }, [params, data]);

    const refetchAll = React.useCallback(() => {
        refetch();
    }, [refetch]);

    const handleSelectRow = React.useCallback((row, isChecked) => {
        if (isChecked) {
            setSelected((prev) => [...prev, row]);
        } else {
            setSelected((prev) => prev.filter((s) => s.id !== row.id));
        }
    }, []);

    const handleSelectAll = React.useCallback((isChecked) => {
        if (isChecked) {
            setSelected(filteredData?.map(row => ({
                id: row.id,
                nbsOrderId: row.nbsOrderId,
                status: row.status,
                mistakeOrderTypeId: row.mistakeOrderTypeId,
                description: row.description
            })) || []);
        } else {
            setSelected([]);
        }
    }, [filteredData]);

    const filteredDataLength = React.useMemo(() => filteredData ? filteredData.length : 0, [filteredData]);

    const tableData = React.useMemo(() => {
        if (status === "loading") return [];
        return (filteredData || []).map(row => ({
            ...row,
            mistakeOrderTypeId: getLookupName("mistakeOrderType", row.mistakeOrderTypeId) || row.mistakeOrderTypeId || '-',
            statusDisplay: getStatusName(row.status)
        }));
    }, [status, filteredData, getLookupName, getStatusName]);

    const columns = [
        {
            cb: (row) => <Checkbox
                checked={selected.some((s) => s.id === row.id)}
                onChange={(e) => handleSelectRow(row, e.target.checked)}
            />,
            label: <Checkbox
                checked={filteredData && filteredData.length > 0 && selected.length === filteredDataLength && filteredDataLength > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                indeterminate={selected.length > 0 && selected.length < filteredDataLength}
            />,
        },
        {
            actionBtn: [
                {
                    icon: <EditIcon color='primary' />,
                    onClick: ({ row }) => popup({
                        title: "עריכת פניה לטעות בהזמנה",
                        content: <AddOrEditMistakeOrder row={row} refetch={refetchAll} />,
                    })
                }
            ]
        },
        ...terms.table(),
    ];

    return (
        <GenericTable
            height="main"
            data={tableData}
            columns={columns}
            loading={status === "loading"}
            title="פניות לקוחות - טעויות בהזמנות"
            header={<Search
                params={params}
                setParams={setParams}
                refetch={refetchAll}
                selected={selected}
            />}
            innerPagination
            actions={selected.length > 0 ? [
                {
                    label: `שינוי סטטוס ל-${selected.length} פניות`,
                    onClick: () => popup({
                        title: "שנה סטטוס פניות",
                        content: <ChangeMistakeOrderStatus
                            rows={selected}
                            refetch={refetchAll}
                        />
                    })
                }
            ] : []}
        />
    );
};

export default MistakeOrders;