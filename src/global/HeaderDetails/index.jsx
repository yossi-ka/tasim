import React from 'react'

import { Grid, Typography } from '@mui/material';

const HeaderDetails = ({ data }) => {

    // console.log(data);

    const [xs, setXs] = React.useState();

    React.useEffect(() => {
        if (data) {
            let length = data.length;
            setXs(12 / length);
        }
    }, [])

    return (
        <Grid container spacing={2} alignItems="center">
            {data.map((item, idx) => {
                return (
                    <Grid key={idx} item xs={xs}>
                        <Typography variant='caption'>{item.title}</Typography>
                        <Typography variant='h4' sx={item.sx ? item.sx : null}>{item.content}</Typography>
                    </Grid>)
            })}
        </Grid>
    )
}

export default HeaderDetails;

