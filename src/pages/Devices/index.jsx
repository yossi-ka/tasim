import React from "react";
import { useQuery } from "react-query";
import EditIcon from '@mui/icons-material/Edit';
import { Checkbox } from "@mui/material";

import Context from "../../context";
import useTerms from "../../terms";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getAllDevices } from "../../api/services/devices";
import AddOrEditDevice from "./AddOrEdit";
import Search from "./Search";

const Devices = () => {
  const { getLookupName, popup } = React.useContext(Context);

  const terms = useTerms("devicesTable");
  const [params, setParams] = React.useState({});
  const [filteredData, setFilteredData] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [showBrokenDevices, setShowBrokenDevices] = React.useState(false);

  const { data, status, refetch } = useQuery("devicesTable", getAllDevices, {
    refetchOnWindowFocus: false,
  });

  const statuses = [
    { label: "זמין", id: 1, key: "available", value: 1 },
    { label: "בשימוש", id: 2, key: "in_use", value: 2 },
    { label: "תקול", id: 3, key: "faulty", value: 3 },
    { label: "נאבד", id: 4, key: "lost", value: 4 },
  ];

  React.useEffect(() => {
    if (!data) return setFilteredData([]);

    // מסנן את הנתונים לפי הפרמטרים
    const filteredByParams = Object.keys(params).length === 0
      ? data
      : search({
        params,
        data,
        getLookupName,
        terms: [...terms.terms]
      });

    // מסנן החוצה מכשירים תקולים או שאבדו (סטטוס 3 ו-4)
    const filteredByStatus = showBrokenDevices
      ? filteredByParams
      : filteredByParams.filter(device => device.status !== 3 && device.status !== 4);

    setFilteredData(filteredByStatus);
  }, [params, data, getLookupName, terms.terms, showBrokenDevices]);



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
      setSelected(filteredData || []);
    } else {
      setSelected([]);
    }
  }, [filteredData]);

  const filteredDataLength = React.useMemo(() => filteredData ? filteredData.length : 0, [filteredData]);

  const columns = [
    //  צ'קבוקסים לבחירה מרובה
    // {
    //   cb: (row) => <Checkbox
    //     checked={selected.some((s) => s.id === row.id)}
    //     onChange={(e) => handleSelectRow(row, e.target.checked)}
    //   />,
    //   label: <Checkbox
    //     checked={filteredData && filteredData.length > 0 && selected.length === filteredDataLength && filteredDataLength > 0}
    //     onChange={(e) => handleSelectAll(e.target.checked)}
    //     indeterminate={selected.length > 0 && selected.length < filteredDataLength}
    //   />,
    // },
    {
      actionBtn: [
        {
          icon: <EditIcon color='primary' />,
          onClick: ({ row }) => popup({
            title: "עריכת מכשיר",
            content: <AddOrEditDevice row={row} refetch={refetchAll} statuses={statuses} />,
          })
        }
      ]
    },
    ...terms.table(),
    {
      label: "סטטוס",
      cb: (row) => {
        const status = statuses.find(s => s.id === row.status);
        return status ? status.label : "-";
      }
    }
  ];

  return (
    <GenericTable
      height="main"
      data={filteredData}
      columns={columns}
      loading={status === "loading"}
      title="מכשירים"
      header={<Search
        params={params}
        setParams={setParams}
        refetch={refetchAll}
        showBrokenDevices={showBrokenDevices}
        setShowBrokenDevices={setShowBrokenDevices}
        setFilteredData={setFilteredData}
        allData={data || []}
        statuses={statuses}
      />}
      innerPagination
    />
  );
};

export default Devices;