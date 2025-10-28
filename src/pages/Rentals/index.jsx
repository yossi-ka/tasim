import React, { useContext } from 'react';
import useTerms from '../../terms';
import { useQuery } from 'react-query';
import { getActiveRentals } from '../../api/services/rentals';
import GenericTable from '../../components/GenericTable';
import Search from './Search';
import AddOrEditRental from './AddOrEdit';
import EditIcon from '@mui/icons-material/Edit';
import Context from '../../context';
import { Checkbox } from '@mui/material';
import ChangeStatus from './ChangeStatus';

function Rentals() {

  const { popup } = useContext(Context);
  const [selected, setSelected] = React.useState([]);
  const [params, setParams] = React.useState({})


  const term = useTerms("rentalsTable");
  const [viewColumn, setViewColumn] = React.useState(term.getTerms().map(t => t.name));

  const statuses = [
    { label: "הזמנה", id: 1, key: "order", value: 1 },
    { label: "פעיל", id: 2, key: "active", value: 2 },
    { label: "מבוטל", id: 3, key: "canceled", value: 3 },
    { label: "הסתיים", id: 4, key: "finished", value: 4 },
  ];

  const getStatusId = (key) => {
    const status = statuses.find((s) => s.key === key);
    return status ? status.id : null;
  }

  const { data, status, refetch } = useQuery("rentalsTable", getActiveRentals, {
    refetchOnWindowFocus: false,
  });

  const handleSelectRow = React.useCallback((row, isChecked) => {
    if (isChecked) {
      setSelected((prev) => [...prev, row]);
    } else {
      setSelected((prev) => prev.filter((s) => s.id !== row.id));
    }
  }, []);

  const handleSelectAll = React.useCallback((isChecked) => {
    if (isChecked) {
      setSelected(data || []);
    } else {
      setSelected([]);
    }
  }, [data]);


  const columns = [
    {
      cb: (row) => <Checkbox
        checked={selected.some((s) => s.id === row.id)}
        onChange={(e) => handleSelectRow(row, e.target.checked)}
      />,
      label: <Checkbox
        checked={data && data.length > 0 && selected.length === data.length && data.length > 0}
        onChange={(e) => handleSelectAll(e.target.checked)}
        indeterminate={selected.length > 0 && selected.length < data.length}
      />,
    },
    {
      actionBtn: [
        {
          icon: <EditIcon color='primary' />,
          onClick: ({ row }) => popup({
            title: "עריכת מכשיר",
            content: <AddOrEditRental row={row} refetch={refetch} statuses={statuses} />,
          })
        }
      ]
    },
    ...term.table(viewColumn),
    {
      label: "סטטוס",
      cb: (row) => {
        const status = statuses.find(s => s.id === row.rentalStatus);
        return status ? status.label : "-";
      }
    }
  ];



  return (
    <GenericTable
      height="main"
      data={data}
      loading={status === "loading"}
      title="השכרות פעילות"
      columns={columns}
      header={<Search
        refetch={refetch}
        termsForExcel={term.excel(viewColumn)}
        dataForExcel={data}
        terms={term}
        params={params}
        setParams={setParams}
        viewColumn={viewColumn}
        setViewColumn={setViewColumn}
        allColumns={term.getTerms()}
      />}
      actions={selected.length > 0 ? [
        {
          label: `שינוי סטטוס ל ${selected.length} השכרות`,
          onClick: () => popup({
            title: "שנה סטטוס השכרות",
            content: <ChangeStatus
              options={statuses}
              status={getStatusId(statuses)}
              rows={selected}
              refetch={() => {
                refetch();
                setSelected([])
              }} />
          }),
          count: selected.length,
        }
      ] : null}
    />
  )
}

export default Rentals;