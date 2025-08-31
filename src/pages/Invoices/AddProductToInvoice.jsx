import React from "react";
import { 
  Box, 
  Chip,
  Typography
} from '@mui/material';
import Context from "../../context";
import MiniProductTable from "./MiniProductTable";
import useTerms from '../../terms';
import GenericForm from "../../components/GenericForm";


const AddProductToInvoice = ({
  data,
  onProductAdded, 
  addProductToInvoice, 
}) => {
  
  const term = useTerms("invoiceRowsTable");
  const { closeSmallPopup } = React.useContext(Context);

  // רכיב הטופס המאוחד
    const [formData, setFormData] = React.useState({});

    const [showProductTable, setShowProductTable] = React.useState(true); // האם להציג את הטבלה

    // חישוב אוטומטי של המחיר הכולל
    React.useEffect(() => {
      const quantity = parseFloat(formData.quantity) || 0;
      const unitPrice = parseFloat(formData.unitPrice) || 0;
      const totalPrice = quantity * unitPrice;
      
      if (totalPrice !== formData.totalPrice) {
        setFormData(prev => ({
          ...prev,
          totalPrice: totalPrice
        }));
      }
    }, [formData.quantity, formData.unitPrice]);

    // פונקציה לבחירת מוצר
    const handleProductSelect = (product) => {
      setFormData(prev => ({
        ...prev,
        selectedProduct: product
      }));
      setShowProductTable(false); // הסתרת הטבלה
    };

    // פונקציה לביטול בחירת מוצר
    const handleProductDeselect = () => {
      setFormData(prev => ({
        ...prev,
        selectedProduct: null
      }));
      setShowProductTable(true); // הצגת הטבלה שוב
    };

    // עדכון המחיר הכולל
    React.useEffect(() => {
      const total = (formData.quantity || 0) * (formData.unitPrice || 0);
      setFormData(prev => ({ ...prev, totalPrice: total }));
    }, [formData.quantity, formData.unitPrice]);

    const handleSubmit = () => {

      // יצירת אובייקט המוצר להוספה
      const productToAdd = {
        id: formData.selectedProduct.id, // הוספת ID של המוצר
        productName: formData.selectedProduct.name,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalPrice: formData.totalPrice,
      };
      
      // הוספת המוצר
      if (addProductToInvoice && typeof addProductToInvoice === 'function') {
        addProductToInvoice(productToAdd);
      } 
      
      // העברת המוצר לקומפוננט האב אם קיים
      onProductAdded && onProductAdded(productToAdd);
      
      // סגירת הpopup
      closeSmallPopup();
    };

    const fields = [
      { type: "empty" },
      { type: "empty" },
      term.field("quantity", { variant: "outlined", size: 12, required: true }),
      term.field("unitPrice", { variant: "outlined", size: 12, required: true }),
      term.field("totalPrice", { variant: "outlined", size: 12, readonly: true }),
      {
            type: "submit",
            label: "הוסף מוצר",
            variant: "contained",
            disabled: !formData.selectedProduct || !formData.quantity || !formData.unitPrice,
        }
    ]

    return (
      <Box sx={{ p: 2 }}>

        {/* בחירת מוצר - טבלה או Chip */}
          {showProductTable ? (
            <MiniProductTable onProductSelect={handleProductSelect} data={data}/>
          ) : (
            <>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                מוצר נבחר:
              </Typography>
              <Chip
                label={formData.selectedProduct?.name}
                onDelete={handleProductDeselect}
                color="primary"
                variant="outlined"
              />
            </Box>
            <GenericForm
              fields={fields}
              initInputs={formData}
              setInitInput={setFormData}
              onSubmit={handleSubmit}
            />
            </>
          )}
      </Box>
    );

  };

export default AddProductToInvoice;
