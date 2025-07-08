import React from "react";
import {
    Box,
    Typography,
    Paper,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const Completion = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', minHeight: '400px' }}>
                <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                    סיום
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    סיכום וסיום התהליך
                </Typography>
            </Paper>
        </Box>
    );
};

export default Completion;
