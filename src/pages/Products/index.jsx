import React from "react";
import { useQuery } from "react-query";
import { Checkbox } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';

import Context from "../../context";
import useTerms from "../../terms";
import Search from "./Search";
import GenericTable from "../../components/GenericTable";
import { search } from "../../utils/search";
import { getAllProducts } from "../../api/services/products";
import { removeVat } from "../../utils/func";
import ManageCategories from "./ManageCategories";
import AddOrEdit from "./AddOrEdit";

const Products = () => {

  const { getLookupName, popup } = React.useContext(Context)

  const terms = useTerms("productsTable");
  const [params, setParams] = React.useState({})
  const [filterdData, setFilterdData] = React.useState([])
  const [selected, setSelected] = React.useState([]);

  const { data, status, refetch } = useQuery("productsTable", getAllProducts, {
    refetchOnWindowFocus: false,
  })

  // חישוב מחיר ללא מע"מ לכל מוצר
  const dataWithVatCalculation = React.useMemo(() => {
    if (!data) return [];

    return data.map(product => ({
      ...product,
      priceWithoutVat: removeVat(product.isVatExempt, product.price)
    }));
  }, [data]);

  React.useEffect(() => {
    if (Object.keys(params).length === 0) return setFilterdData(dataWithVatCalculation)
    search({
      params, data: dataWithVatCalculation, setData: setFilterdData, getLookupName, terms: [...terms.terms,]
    })
  }, [params, dataWithVatCalculation]);

  const refetchAll = () => {
    refetch();
    setSelected([]);
  }

  const filterdDataLength = React.useMemo(() => {
    if (status == "loading") return 0
    return dataWithVatCalculation.length
  }, [dataWithVatCalculation, status]);

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
    {
      actionBtn: [
        {
          icon: <EditIcon color='primary' />,
          onClick: ({ row }) => popup({
            title: "עריכת מוצר",
            content: <AddOrEdit row={row} refetch={refetchAll} />,
          })
        }
      ]
    },
    ...terms.table(),

  ]

  return (
    <GenericTable
      height="main"
      data={status == "loading" ? [] : filterdData}
      columns={columns}
      loading={status == "loading"}
      title="מוצרים"
      header={<Search
        params={params}
        setParams={setParams}
        refetch={refetchAll}
      />}
      innerPagination
      actions={selected.length > 0 ? [
        {
          label: `שינוי סטטוס ל ${selected.length} הזמנות`,
          onClick: () => popup({
            title: "שנה סטטוס הזמנות",
            content: <ManageCategories
              rows={selected}
              refetch={() => {
                refetchAll();
                setSelected([])
              }} />
          }),
          count: selected.length,
        }
      ] : null}
    />
  )
}

export default Products;
