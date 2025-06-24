import React from 'react'
import { useState } from 'react';

// material-ui
import {
    Typography,
    Button,
    Tooltip,
} from '@mui/material';

import { formatReadMore } from '../../utils/func';

const CopyColView = ({ isReadMore, value }) => {

    const [copyed, setCopyed] = useState(false);

    return (
        <Tooltip title={
            <>
                <Typography variant="body1">
                    {copyed ? "הועתק ללוח !" : "ניתן ללחוץ כדי להעתיק:"}
                </Typography>
                {isReadMore && <Typography variant="body2">{value}</Typography>}
            </>
        } arrow>
            <Button
                variant="text"
                color="primary"
                size="small"
                sx={{ fontSize: '95%', m: 0, p: 0 }}
                onClick={() => {
                    navigator.clipboard.writeText(value);
                    setCopyed(true);
                    setTimeout(() => {
                        setCopyed(false);
                    }, 2000);
                }}
            >
                {isReadMore ? formatReadMore(value) : value}
            </Button>
        </Tooltip>
    )
}

export default CopyColView;
