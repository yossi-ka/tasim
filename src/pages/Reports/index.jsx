import { useState } from 'react'
import SelectDateRange from './SelectDateRange';
import ReportTable from './ReportTable';

function Index() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  })
  return (
    <>
      {dateRange.startDate === null || dateRange.endDate === null ? 
        <SelectDateRange dateRange={dateRange} setDateRange={setDateRange} /> : 
        <ReportTable dateRange={dateRange} setDateRange={setDateRange} />}
    </>
  )
}

export default Index