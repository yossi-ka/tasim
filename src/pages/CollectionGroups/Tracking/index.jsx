import React from "react";
import {
    Box,
    Typography,
    Paper,
} from "@mui/material";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";

const Tracking = () => {
    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3, textAlign: 'center', minHeight: '400px' }}>
                <TrackChangesIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" gutterBottom>
                    מעקב
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    כאן תוכל לעקוב אחר התקדמות העבודה
                </Typography>
            </Paper>
        </Box>
    );
};

export default Tracking;
