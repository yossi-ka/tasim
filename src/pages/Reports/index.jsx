import { useState } from 'react'
import SelectDateRange from './SelectDateRange';
import ReportTable from './Products/ReportTable';
import { Grid } from '@mui/material';
import { getAllProductsForReport } from "../../api/services/reports";
import { useQuery } from 'react-query';
import DaysReportTable from './Days/DaysReportTable';

function Index() {
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  })


  const { data, status, refetch } = useQuery("reportByProduct", () => getAllProductsForReport(dateRange), {
    refetchOnWindowFocus: false,
    enabled: !!dateRange.startDate && !!dateRange.endDate
  })
  //תאריך |כמות הזמנות ||סכום הזמנות | סכום זיכויים

  return (
    <>
      {dateRange.startDate === null || dateRange.endDate === null ?
        <SelectDateRange dateRange={dateRange} setDateRange={setDateRange} /> :
        <Grid container spacing={2}>
          <Grid item xs={8}>
            <ReportTable data={data} status={status} refetch={refetch} dateRange={dateRange} setDateRange={setDateRange} />
          </Grid>
          <Grid item xs={4}>
            <DaysReportTable data={data} status={status} refetch={refetch} setDateRange={setDateRange} />
            {/* Additional content can go here */}
          </Grid>
        </Grid>
      }
    </>
  )
}

export default Index