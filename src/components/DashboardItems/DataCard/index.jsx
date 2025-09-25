import React from "react";
import { useNavigate } from "react-router-dom";

import { Button, Card, CardActions, CardContent, Grid, Stack, Typography } from "@mui/material";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import LoudingData from "../../LoadingData";

const DataCard = ({ title, data, linkTo, icon }) => {

    const nav = useNavigate();

    return (
        <Card sx={{ borderRadius: "15%" }} elevation={5}>
            <CardContent>
                <Grid container spacing={1}>
                    <Grid item xs={10}>
                        <Stack direction="column" spacing={1}>
                            <Typography fontSize={12} variant="h3" color="primary.400">{title}</Typography>
                            {data !== "loading" ?
                                <Typography align="center" variant="h4" color="primary.main">{data}</Typography> :
                                <LoudingData height={25} />}
                        </Stack>
                    </Grid>
                    <Grid item xs={2}>
                        {icon}
                    </Grid>
                </Grid>
            </CardContent>
            <CardActions>
                <Button
                    endIcon={<OpenInNewIcon />}
                    size="small"
                    color="primary"
                    onClick={() => nav(linkTo)}
                >
                    מעבר לעמוד
                </Button>
            </CardActions>
        </Card>
    );
}
export default DataCard;