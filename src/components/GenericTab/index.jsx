import React from "react";

import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";

const GenericTab = ({ tabs, orientation = "horizontal" }) => {
    const [value, setValue] = React.useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ width: '100%', overflow: 'hidden', display: orientation !== "horizontal" ? 'flex' : '' }}>
            {orientation === "horizontal" ? (
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ width: 1, borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tabs value={value} onChange={handleChange} sx={{ width: 1 }}>
                        {tabs.map((tab, index) => (
                            <Tab key={index} label={<Typography>{tab.label}</Typography>} />
                        ))}
                    </Tabs>
                </Stack>
            ) : (
                <Box sx={{}}>
                    <Tabs
                        orientation="vertical"
                        variant="scrollable"
                        value={value}
                        onChange={handleChange}
                        sx={{ borderRight: 1, borderColor: 'divider' }}
                    >
                        {tabs.map((tab, index) => (
                            <Tab key={index} label={<Typography>{tab.label}</Typography>} />
                        ))}
                    </Tabs>
                </Box>
            )}

            <Box
                sx={{
                    p: 3,
                    width: 1,
                    height: "80vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                    // bgcolor: "#fff",
                }}
            >
                {tabs[value].content}
            </Box>
        </Box>
    );
};

GenericTab.defaultProps = {
    tabs: []
}

export default GenericTab;


