import React from 'react';
import { Button, Grid, CircularProgress, Box, Typography } from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import PrintIcon from '@mui/icons-material/Print';
import { useMutation } from 'react-query';
import usePrint from '../../context/hooks/print/usePrint';
import OrderPages from '../CollectionGroups/Tracking/OrderPages';
import StickerPages from '../CollectionGroups/Tracking/StickerPages';
import { getOrdersWithProductsByOrderIds } from '../../api/services/orders';
import Context from '../../context';

const PrintOrders = ({ orders = [] }) => {
  const { getLookupName } = React.useContext(Context);

  const { handlePrint, printComponent } = usePrint();

  const printOrderPages = useMutation(() => getOrdersWithProductsByOrderIds(orders.map(order => order.id), null, true), {
    onSuccess: (data) => {
      if (!data || data.length === 0) {
        alert("לא נמצאו הזמנות");
        return;
      }

      const pages = OrderPages({ orders: data });

      handlePrint(pages);
    },
    onError: (error) => {
      alert("שגיאה בהדפסת דפי הזמנות");
      console.error(error);
    }
  });

  const printStickers = useMutation(() => getOrdersWithProductsByOrderIds(orders.map(order => order.id)), {
    onSuccess: (data) => {
      if (!data || data.length === 0) {
        alert("לא נמצאו הזמנות");
        return;
      }
      const pages = StickerPages({ orders: data });
      handlePrint(pages);
    },
    onError: (error) => {
      console.log(123);

      alert("שגיאה בהדפסת מדבקות");
      console.error('*', error);
    }
  });

  const printDairyStickers = useMutation(() => getOrdersWithProductsByOrderIds(orders.map(order => order.id), "EMqF46IO87uoCUKEXgpT"), {
    onSuccess: (data) => {
      if (!data || data.length === 0) {
        alert("לא נמצאו הזמנות");
        return;
      }
      const title = getLookupName("globalProductCategories", "EMqF46IO87uoCUKEXgpT");
      const pages = StickerPages({ orders: data, title, amountStickers: 1 });
      handlePrint(pages);
    },
    onError: (error) => {
      alert("שגיאה בהדפסת מדבקות");
      console.error(error);
    }
  });

  const printFrozenStickers = useMutation(() => getOrdersWithProductsByOrderIds(orders.map(order => order.id), "DxeXWyncOuVO9u2tft7z"), {
    onSuccess: (data) => {
      if (!data || data.length === 0) {
        alert("לא נמצאו הזמנות");
        return;
      }
      const title = getLookupName("globalProductCategories", "DxeXWyncOuVO9u2tft7z");
      const pages = StickerPages({ orders: data, title, amountStickers: 1 });
      handlePrint(pages);
    },
    onError: (error) => {
      alert("שגיאה בהדפסת מדבקות");
      console.error(error);
    }
  });

  return (
    <Box sx={{
      p: 4,
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      borderRadius: 4,
      border: '1px solid #dee2e6',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
    }}>
      <Typography variant="h6" textAlign="center" sx={{
        mb: 4,
        color: '#2c3e50',
        fontWeight: 600,
        fontSize: '1.1rem'
      }}>
        <PrintIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#3498db' }} />
        הדפסת דוחות - {orders.length} הזמנות נבחרו
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => printStickers.mutate()}
            disabled={printStickers.isLoading || orders.length === 0}
            startIcon={printStickers.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <LocalOfferIcon />}
            sx={{
              height: 56,
              backgroundColor: '#3498db',
              borderRadius: 3,
              fontSize: '0.9rem',
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(52, 152, 219, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#2980b9',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)'
              },
              '&:disabled': {
                backgroundColor: '#bdc3c7',
                transform: 'none'
              }
            }}
          >
            {printStickers.isLoading ? 'מכין מדבקות...' : 'דפי מדבקות להזמנה'}
          </Button>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => printDairyStickers.mutate()}
            disabled={printDairyStickers.isLoading || orders.length === 0}
            startIcon={printDairyStickers.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <ReceiptIcon />}
            sx={{
              height: 56,
              backgroundColor: '#27ae60',
              borderRadius: 3,
              fontSize: '0.9rem',
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(39, 174, 96, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#229954',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(39, 174, 96, 0.4)'
              },
              '&:disabled': {
                backgroundColor: '#bdc3c7',
                transform: 'none'
              }
            }}
          >
            {printDairyStickers.isLoading ? 'מכין מדבקות...' : 'דפי מדבקות לחלבי'}
          </Button>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => printFrozenStickers.mutate()}
            disabled={printFrozenStickers.isLoading || orders.length === 0}
            startIcon={printFrozenStickers.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <AcUnitIcon />}
            sx={{
              height: 56,
              backgroundColor: '#2196f3',
              borderRadius: 3,
              fontSize: '0.9rem',
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#1976d2',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)'
              },
              '&:disabled': {
                backgroundColor: '#bdc3c7',
                transform: 'none'
              }
            }}
          >
            {printFrozenStickers.isLoading ? 'מכין מדבקות...' : 'דפי מדבקות לקפואים'}
          </Button>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => printOrderPages.mutate()}
            disabled={printOrderPages.isLoading || orders.length === 0}
            startIcon={printOrderPages.isLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <ShoppingCartIcon />}
            sx={{
              height: 56,
              backgroundColor: '#e67e22',
              borderRadius: 3,
              fontSize: '0.9rem',
              fontWeight: 500,
              textTransform: 'none',
              boxShadow: '0 2px 8px rgba(230, 126, 34, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#d35400',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(230, 126, 34, 0.4)'
              },
              '&:disabled': {
                backgroundColor: '#bdc3c7',
                transform: 'none'
              }
            }}
          >
            {printOrderPages.isLoading ? 'מכין דפי הזמנה...' : 'דפי הזמנה ללקוח'}
          </Button>
        </Grid>
      </Grid>

      {/* קומפוננטת ההדפסה */}
      {printComponent}
    </Box>
  );
};

export default PrintOrders;