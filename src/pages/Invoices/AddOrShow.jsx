import React, { useEffect } from 'react';
import useTerms from '../../terms';
import { useMutation, useQuery } from 'react-query';
import { addInvoice, getInvoiceProducts } from '../../api/services/invoices';
import { getAllProducts } from '../../api/services/products';
import Context from '../../context';
import GenericForm from '../../components/GenericForm';
import GenericTable from '../../components/GenericTable';
import { IconButton, Tooltip, Stack, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import AddProductToInvoice from './AddProductToInvoice';

const AddOrUpdate = ({
    row,
    refetch
}) => {

    const { user, snackbar, closePopup, smallPopup } = React.useContext(Context);
    const [initInputs, setInitInputs] = React.useState(row || {});

    // state מקומי למוצרים - כל popup מנהל בעצמו
    const [localInvoiceProducts, setLocalInvoiceProducts] = React.useState([]);

    //  טעינה ראשונית על מנת לחסוך את זמן הטעינה במיני טבלה
    const startLoadingProducts = useQuery("products", getAllProducts, {
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 דקות - הנתונים נחשבים רלוונטיים למשך 5 דקות
        cacheTime: 10 * 60 * 1000, // 10 דקות - הנתונים נשמרים בזיכרון למשך 10 דקות אחרי שאין קומפוננטות שמשתמשות בהם
        // refetchInterval: 5 * 60 * 1000, // רענון אוטומטי כל 5 דקות
        // refetchIntervalInBackground: true, // ממשיך לרענן גם כשהטאב לא פעיל
    });

    const invoiceProducts = useQuery(["invoiceProducts", row?.id], () => getInvoiceProducts(row.id), {
        refetchOnWindowFocus: false,
        enabled: !!row
    });

    useEffect(() => {
        if (invoiceProducts.data) {
            setLocalInvoiceProducts(invoiceProducts.data);
        }
    }, [invoiceProducts.data]);

    const addProductToInvoice = (product) => {
        setLocalInvoiceProducts(prev => {
            const newList = [...prev, product];
            return newList;
        });
    };

    const removeProductFromInvoice = (productId) => {
        setLocalInvoiceProducts(prev => prev.filter(product => product.id !== productId));
    };

    const term = useTerms("updateInvoice");
    const tableTerm = useTerms("invoiceRowsTable");
    const columns = [...tableTerm.table(null, {
        unitPriceWithVAT: {
            cb: (row) => (row.unitPrice * process.env.REACT_APP_VAT_RATE).toFixed(2)
        },
        totalPriceWithVAT: {
            cb: (row) => (row.totalPrice * process.env.REACT_APP_VAT_RATE).toFixed(2)
        }
    }),
    !row && {
        actionBtn: [
            {
                icon: <DeleteIcon color='primary' />,
                label: "מחיקה",
                onClick: ({ row }) => removeProductFromInvoice(row.id)
            },
        ]
    },
    ];

    // רכיב רשימת המוצרים עם GenericTable
    const ProductsList = React.useMemo(() => {

        if (!row && (!localInvoiceProducts || localInvoiceProducts.length === 0)) {
            return (
                <div style={{ textAlign: 'center', padding: '20px', color: '#546e7a' }}>
                    אין מוצרים בחשבונית - לחץ על כפתור + להוספת מוצר
                </div>
            );
        }

        return (
            <Stack direction="column">
                <GenericTable
                    data={row ? invoiceProducts.data : localInvoiceProducts}
                    columns={columns}
                    loading={invoiceProducts.status === "loading"}
                    customHeight={{
                        container: 200,
                        tableContent: 1,
                        header: 0,
                        footer: 1
                    }}
                />
                <div style={{
                    padding: '10px',
                    backgroundColor: '#e3f2fd',
                    fontWeight: 'bold',
                    textAlign: 'left',
                    borderTop: '1px solid #90caf9'
                }}>
                    שורות: {localInvoiceProducts.length} |
                    מוצרים: {localInvoiceProducts.reduce((total, product) => total + (product.quantity || 0), 0)} |
                    לתשלום: {localInvoiceProducts.reduce((total, product) => total + (product.unitPrice * product.quantity), 0).toFixed(2)} ₪ |
                    לתשלום כולל מע"מ: {localInvoiceProducts.reduce((total, product) => total + (product.unitPrice * process.env.REACT_APP_VAT_RATE * product.quantity), 0).toFixed(2)} ₪
                </div>
            </Stack>
        );
    }, [localInvoiceProducts]);

    // פונקציה לפתיחת טופס הוספת מוצר
    const openAddProductForm = () => {
        smallPopup({
            title: "הוספת מוצר לחשבונית",
            content: <AddProductToInvoice
                autoOpenPopup={false}
                addProductToInvoice={addProductToInvoice}
                invoiceProducts={localInvoiceProducts}
                removeProductFromInvoice={removeProductFromInvoice}
            />
        });
    };

    const update = useMutation((obj) => addInvoice(obj, user.id), {
        onSuccess: () => {
            closePopup();
            snackbar("החשבונית נוספה בהצלחה", "success");
            refetch();
        },
        onError: (error) => {
            console.error("Error updating invoice:", error);
            snackbar("עדכון נכשל", "error");
        }
    });

    const fields = [
        { type: 'line', label: "פרטי חשבונית" },
        term.field("invoiceNumber", { variant: "outlined", size: 6, required: true }),
        term.field("supplier", { variant: "outlined", size: 6, required: true }),
        term.field("invoiceDate", { variant: "outlined", size: 6, required: true }),
        term.field("dueDate", { variant: "outlined", size: 6 }),
        term.field("notes", { variant: "outlined", size: 12 }),
        { type: 'line', label: "מוצרים בחשבונית" },
        { type: 'empty', size: 11 },
        {
            cb: () =>
                <Tooltip
                    title={"הוסף מוצר חדש"}
                    arrow>
                    {!row && <span>
                        <IconButton
                            onClick={openAddProductForm}
                        >
                            <AddIcon color={"primary"} />
                        </IconButton>
                    </span>}
                </Tooltip>,
            size: 1
        },
        // רשימת המוצרים
        { cb: () => ProductsList, size: 12 },
        {
            type: 'submit',
            label: row ? "סגירה" : "הוסף חשבונית",
            variant: "contained",
            disabled: localInvoiceProducts.length === 0 || update.isLoading || !initInputs.invoiceNumber || !initInputs.supplier || !initInputs.invoiceDate
        }
    ]

    return (
        <Box maxHeight={"80vh"} sx={{ overflowY: "auto" }}>
            <GenericForm
                initInputs={initInputs}
                setInitInput={setInitInputs}
                fields={fields}
                onSubmit={(data) => {
                    if (row) {
                        // במקרה של צפייה - פשוט סוגר
                        closePopup();
                    } else {
                        // במקרה של הוספה חדשה
                        data.products = localInvoiceProducts;
                        update.mutate(data);
                    }
                }}
                readonly={row}
            />

        </Box>
    )
}

export default AddOrUpdate;
