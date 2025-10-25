import React from 'react';
import useTerms from '../../terms';
import { useQuery } from 'react-query';
import { getActiveRentals } from '../../api/services/rentals';
import GenericTable from '../../components/GenericTable';
import Search from './Search';

function Rentals() {

  const terms = useTerms("rentalsTable");

  const { data, status, refetch } = useQuery("rentalsTable", getActiveRentals, {
    refetchOnWindowFocus: false,
  });

  const statuses = [
    { label: "פעיל", id: 1, key: "active", value: 1 },
    { label: "הסתיים", id: 2, key: "completed", value: 2 },
    { label: "מבוטל", id: 3, key: "canceled", value: 3 },
    { label: "מושהה", id: 4, key: "paused", value: 4 },
    { label: "הושלם עם בעיות", id: 5, key: "completed_with_issues", value: 5 },
  ];


  return (
    <GenericTable
      height="main"
      data={data}
      loading={status === "loading"}
      title="השכרות פעילות"
      columns={terms.table()}
      header={<Search 
        refetch={refetch}
      />}
    />
  )
}

export default Rentals;