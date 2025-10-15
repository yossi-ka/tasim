import React from 'react';

import { Tooltip, Typography, Box } from '@mui/material';


const TooltipTypography = ({ label, data, row }) => {
    return (
        <Tooltip arrow
            sx={{
                backgroundColor: '#f5f5f9',
                color: 'rgba(0, 0, 0, 0.87)',
                maxWidth: 220,
                fontSize: 12,
                border: '1px solid #dadde9'
            }}
            title={
                <>
                    <Typography variant='body1' color="inherit">
                        {data.map((item, index) => {
                            return <Box key={index} >
                                <span style={{ fontSize: "75%" }}>
                                    {isFunction(item.label) ? item.label({ row }) : item.label}
                                </span>
                                <span>&nbsp;</span>
                                {isFunction(item.content) ? item.content({ row }) : row[item.content]}
                                <br />
                            </Box>
                        })}
                    </Typography>
                </>
            }>
            <Typography variant='subtitle2' color='primary' sx={{ cursor: 'pointer' }}>
                {isFunction(label) ? label({ row }) : label}
            </Typography>
        </Tooltip>
    )
}


export default TooltipTypography;

// check if is function
function isFunction(value) {
    return typeof value === 'function';
}
