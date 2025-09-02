import React from "react";
import { useQuery } from "react-query";
import { Checkbox } from "@mui/material";
import Context from "../../../context";
import useTerms from "../../../terms";
import Search from "./Search";
import GenericTable from "../../../components/GenericTable";
import { search } from "../../../utils/search";
import { getAllProductsForReport } from "../../../api/services/reports";
import { formatDate } from "../../../utils/func";


const ReportTable = ({ dateRange, setDateRange }) => {

  const { getLookupName } = React.useContext(Context)

  const terms = useTerms("reportByProduct");
  const [params, setParams] = React.useState({})
  const [filterdData, setFilterdData] = React.useState([])
  const [selected, setSelected] = React.useState([]);

  const { data, status, refetch } = useQuery("reportByProduct", () => getAllProductsForReport(dateRange), {
    refetchOnWindowFocus: false,
  })

  const normalizeProductData = React.useMemo(() => {
    if (!data) return []
    if (data.productData.length === 0) return []
    const obj = {};
    data.orderProducts.forEach(op => {
      if (!obj[op.productId]) {
        obj[op.productId] = {
          orderCount: 0,
          missOrderCount: 0,
          unitCount: 0,
          missUnitCount: 0,
          paidAmount: 0
        };
      }

      if (op.status === 4) {
        obj[op.productId].missOrderCount++;
        obj[op.productId].missUnitCount += op.quantityOrWeight;
      } else {
        obj[op.productId].orderCount++;
        obj[op.productId].unitCount += op.quantityOrWeight;
        obj[op.productId].paidAmount += op.price * op.quantityOrWeight;
      }
    })
    return data.productData.map(product => {
      const productStats = obj[product.id] || {
        orderCount: 0,
        missOrderCount: 0,
        unitCount: 0,
        missUnitCount: 0,
        paidAmount: 0
      };

      return {
        ...product,
        ...productStats,
      };
    })
  }, [data])

  React.useEffect(() => {
    if (Object.keys(params).length === 0) return setFilterdData(normalizeProductData)
    search({
      params, data: normalizeProductData, setData: setFilterdData, getLookupName, terms: [...terms.terms,]
    })
  }, [params, normalizeProductData]);

  const refetchAll = () => {
    refetch();
    setSelected([]);
  }

  const filterdDataLength = React.useMemo(() => {
    if (status == "loading") return 0
    return filterdData.length
  }, [filterdData, status]);

  const columns = [
    {
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
    ...terms.table(),

  ]

  return (
    <GenericTable
      height="main"
      data={status == "loading" ? [] : filterdData}
      columns={columns}
      loading={status == "loading"}
      title={`דו"ח מוצרים לתאריכים ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`}
      header={<Search
        setDateRange={setDateRange}
        params={params}
        setParams={setParams}
        refetch={refetchAll}
      />}
      innerPagination
    />
  )
}

export default ReportTable;
