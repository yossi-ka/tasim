import React from 'react';

import { Stack, CircularProgress } from '@mui/material';

const LoadingData = ({height}) => {
    return (
        <Stack direction="column" alignItems="center" justifyContent="center" sx={{ width: 1, height: height }}>
            <CircularProgress />
        </Stack>
    )
}

LoadingData.defaultProps = {
    height: "65vh"
}

export default LoadingData;