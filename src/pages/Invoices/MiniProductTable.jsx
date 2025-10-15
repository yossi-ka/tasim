import React from "react";

import Context from "../../context";
import useTerms from "../../terms";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import GenericForm from "../../components/GenericForm";
import { useQuery } from "react-query";
import { getAllProducts } from "../../api/services/products";
import { Tooltip, IconButton } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';


const MiniProductTable = ({ onProductSelect }) => {
  const { getLookupName } = React.useContext(Context);

  const terms = useTerms("MiniProductsTable");
  const [params, setParams] = React.useState({});
  const [filterdData, setFilterdData] = React.useState([]);
  const [selectedProduct, setSelectedProduct] = React.useState(null); // state לשמירת המוצר הנבחר

  const { data, status: productsLoadingStatus, refetch } = useQuery("products", getAllProducts, {
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 דקות - הנתונים נחשבים רלוונטיים למשך 5 דקות
    cacheTime: 10 * 60 * 1000, // 10 דקות - הנתונים נשמרים בזיכרון למשך 10 דקות אחרי שאין קומפוננטות שמשתמשות בהם
    // refetchInterval: 5 * 60 * 1000, // רענון אוטומטי כל 5 דקות
    // refetchIntervalInBackground: true, // ממשיך לרענן גם כשהטאב לא פעיל
  });

  // פונקציה לטיפול בלחיצה על שורה
  const handleRowClick = (product) => {
    setSelectedProduct(product);

    // העברת הנתונים לקומפוננט האב אם הפונקציה קיימת
    if (onProductSelect && typeof onProductSelect === 'function') {
      onProductSelect(product);
    }
  };

  React.useEffect(() => {
    if (!data) return;
    if (Object.keys(params).length === 0) return setFilterdData(data);
    search({
      params,
      data,
      setData: setFilterdData,
      getLookupName,
      terms: [...terms.terms],
    });
  }, [params, data]);

  const columns = [
    ...terms.table(),
  ];

  const fields = [
    { name: 'globalSearch', label: 'חיפוש כללי', size: 10, variant: "outlined" },
    { type: "empty", size: 1.5 },
    {
      cb: () => <Tooltip title={"רענן מוצרים"}>
        <IconButton onClick={() => { refetch() }} >
          <RefreshIcon color='primary' />
        </IconButton>
      </Tooltip>, size: 0.5
    }
  ];

  return (
    <GenericTable
      customHeight={{
        container: 400,
        tableContent: 1,
        header: 0,
        footer: 0,
      }}
      data={filterdData || []}
      columns={columns}
      header={
        <GenericForm
          fields={fields}
          initInputs={params}
          setInitInput={setParams}
        />
      }
      innerPagination
      rowsPerPage={10}
      onRowClick={handleRowClick} // הוספת הפונקציה לטיפול בלחיצה על שורה
      selectedRowId={selectedProduct?.id} // הדגשת השורה הנבחרת
      rowClickable={true} // הפיכת השורות לקליקיות
      loading={productsLoadingStatus === "loading"}
    />
  );
};

export default MiniProductTable;
