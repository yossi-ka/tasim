import React from 'react';
import useTerms from '../../terms';
import { useQuery } from 'react-query';
import { getActiveRentals } from '../../api/services/rentals';

function Rentals() {

  const terms = useTerms("rentalsTable");

  const { data, status, refetch } = useQuery("rentalsTable", getActiveRentals, {
    refetchOnWindowFocus: false,
  });

  return (
    <div>Rentals</div>
  )
}

export default Rentals;