// create a react component that will display colck and date
import React from 'react';

import { Box, Typography } from '@mui/material';

const TestRo = () => {
    
        const [time, setTime] = React.useState(new Date().toLocaleTimeString());
    
        React.useEffect(() => {
            let timer = setInterval(() => {
                setTime(new Date().toLocaleTimeString());
            }, 1000);
            return () => {
                clearInterval(timer);
            }
        }, []);
    
        return (
            <Box sx={{ width: 1, height: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="h1" color="text.secondary">
                    {time}
                </Typography>
            </Box>
        )
    }

export default TestRo;