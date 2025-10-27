import React, { useContext } from 'react';
import useTerms from '../../terms';
import { useQuery } from 'react-query';
import { getActiveRentals } from '../../api/services/rentals';
import GenericTable from '../../components/GenericTable';
import Search from './Search';
import AddOrEditRental from './AddOrEdit';
import EditIcon from '@mui/icons-material/Edit';
import Context from '../../context';

function Rentals() {

  const {popup} = useContext(Context);
  const [selected, setSelected] = React.useState([]);

  const terms = useTerms("rentalsTable");
  
  const statuses = [
    { label: "פעיל", id: 1, key: "active", value: 1 },
    { label: "הסתיים", id: 2, key: "completed", value: 2 },
    { label: "מבוטל", id: 3, key: "canceled", value: 3 },
    { label: "מושהה", id: 4, key: "paused", value: 4 },
    { label: "הושלם עם בעיות", id: 5, key: "completed_with_issues", value: 5 },
  ];

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
        setSelected(filteredData || []);
      } else {
        setSelected([]);
      }
    }, [filteredData]);


  const columns = [
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
            content: <AddOrEditRental row={row} refetch={refetch} statuses={statuses} />,
          })
        }
      ]
    },
    ...terms.table(),
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
      />}
    />
  )
}

export default Rentals;