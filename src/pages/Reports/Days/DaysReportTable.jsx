import React from "react";
import Context from "../../../context";
import useTerms from "../../../terms";
import Search from "./Search";
import GenericTable from "../../../components/GenericTable";
import { search } from "../../../utils/search";


const ReportTable = ({ data, status, refetch, setDateRange }) => {

  const { getLookupName } = React.useContext(Context)

  const terms = useTerms("reportByDay");
  const [params, setParams] = React.useState({})
  const [filterdData, setFilterdData] = React.useState([])
  const [selected, setSelected] = React.useState([]);

  const normalizeProductData = React.useMemo(() => {
    if (!data) return [];
    if (!data.ordersData || data.ordersData.length === 0) return [];

    // שלב 1: יצירת מפה של מוצרים לפי orderId
    const orderProductsMap = {};
    data.orderProducts.forEach(orderProduct => {
      if (!orderProductsMap[orderProduct.orderId]) {
        orderProductsMap[orderProduct.orderId] = [];
      }
      orderProductsMap[orderProduct.orderId].push(orderProduct);
    });

    // שלב 2: קיבוץ הנתונים לפי תאריך
    const dayStats = {};

    // עבור כל הזמנה
    data.ordersData.forEach(order => {
      if (!order.closedAt || !order.closedAt.toDate) return;

      const orderDate = order.closedAt.toDate();
      const dateKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dayStats[dateKey]) {
        dayStats[dateKey] = {
          date: dateKey,
          orderCount: 0,
          productsStatusNot4: 0,
          productsStatus4: 0,
          salesStatusNot4: 0,
          salesStatus4: 0
        };
      }

      // ספירת הזמנות
      dayStats[dateKey].orderCount++;

      // עיבוד מוצרי ההזמנה
      const orderProducts = orderProductsMap[order.id] || [];
      orderProducts.forEach(orderProduct => {
        const quantity = orderProduct.quantityOrWeight || 1;
        console.log(quantity);

        const price = orderProduct.price || 0;
        const totalPrice = quantity * price;

        if (orderProduct.status === 4) {
          dayStats[dateKey].productsStatus4 += quantity;
          dayStats[dateKey].salesStatus4 += totalPrice;
        } else {
          dayStats[dateKey].productsStatusNot4 += quantity;
          dayStats[dateKey].salesStatusNot4 += totalPrice;
        }
      });
    });

    // המרה למערך וסדר לפי תאריך
    return Object.values(dayStats).sort((a, b) => new Date(a.date) - new Date(b.date));
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

  const columns = [
    ...terms.table(),
  ]

  return (
    <GenericTable
      height="main"
      data={status == "loading" ? [] : filterdData}
      columns={columns}
      loading={status == "loading"}
      title={"דו\"ח לפי תאריך"}
      header={<Search
        setDateRange={setDateRange}
        params={params}
        setParams={setParams}
        refetch={refetchAll}
        termForExcel={terms.terms}
        dataForExcel={filterdData}
        selected={selected}
        allColumns={terms.table()} // העמודות עם key ו-label
      />}
      innerPagination
    />
  )
}

export default ReportTable;
