import React from 'react';
import { Box } from '@mui/material';


const Header = ({ header }) => {
    return (
        <Box sx={{ py: 2.5, px: 3 }}>
            {header}
        </Box>
    );
}
export default Header;