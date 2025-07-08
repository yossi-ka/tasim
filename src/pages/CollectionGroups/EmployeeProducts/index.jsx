import React from "react";
import {
    Box,
    Typography,
    Paper,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

const EmployeeProducts = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', minHeight: '400px' }}>
                <PersonIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                    מוצרים לעובדים
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    כאן תוכל לנהל את החלוקה של המוצרים לעובדים
                </Typography>
            </Paper>
        </Box>
    );
};

export default EmployeeProducts;
