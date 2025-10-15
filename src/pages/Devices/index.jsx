import React from "react";
import { useQuery } from "react-query";
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Checkbox } from "@mui/material";

import Context from "../../context";
import useTerms from "../../terms";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getAllDevices, deleteDevice } from "../../api/services/devices";
import AddOrEditDevice from "./AddOrEdit";
import Search from "./Search";

const Devices = () => {
  const { getLookupName, popup, confirm } = React.useContext(Context);

  const terms = useTerms("devicesTable");
  const [params, setParams] = React.useState({});
  const [filteredData, setFilteredData] = React.useState([]);
  const [selected, setSelected] = React.useState([]);

  const { data, status, refetch } = useQuery("devices", getAllDevices, {
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
  }, [params, data, getLookupName, terms.terms]);

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

  const handleDeleteDevice = (row) => {
    console.log('Device deleted successfully!');
  };

  const filteredDataLength = React.useMemo(() => filteredData ? filteredData.length : 0, [filteredData]);

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
            title: "עריכת מכשיר",
            content: <AddOrEditDevice row={row} refetch={refetchAll} />,
          })
        },
        {
          icon: <DeleteIcon color='error' />,
          onClick: ({ row }) => handleDeleteDevice(row)
        }
      ]
    },
    ...terms.table(),
  ];

  return (
    <GenericTable
      height="main"
      // data={tableData}
      data={status == "loading" ? [] : filteredData}
      columns={columns}
      loading={status === "loading"}
      title="ניהול מכשירים"
      header={<Search
        params={params}
        setParams={setParams}
        refetch={refetchAll}
        selected={selected}
      />}
      innerPagination
    />
  );
};

export default Devices;