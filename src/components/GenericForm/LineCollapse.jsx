import React from 'react';

import { Box, Divider, Grid, Typography, IconButton, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';


const LineCollapse = ({ field, fixColSize, switchField, readonlyState, allFieldsSetting }) => {

    const theme = useTheme();

    const [open, setOpen] = React.useState(field.open);

    return (
        <>
            <Divider sx={{ borderColor: theme.palette.primary.lighter, mt: !field.mt ? 3 : field.mt }} />
            <Typography
                variant='subtitle1'
                color="primary"
            >
                {field.label}
                <IconButton
                    size="small"
                    sx={{ ml: 1 }}
                    onClick={() => setOpen(!open)}
                >
                    <ExpandMoreIcon
                        color='primary'
                        sx={{
                            transform: open ? 'rotate(180deg)' : 'none',
                            transition: theme.transitions.create('transform', {
                                duration: theme.transitions.duration.shortest,
                            }),
                        }}
                    />
                </IconButton>
            </Typography>

            <Collapse in={open}>
                <Box sx={{
                    width: 1,
                    border: field.border ? `1px solid ${theme.palette.grey[200]}` : 'none',
                    borderRadius: '4px',
                    p: field.border ? 2 : 0,
                    mt: 2,
                }}>
                    <Grid container spacing={2}>
                        {field.fields.map((fieldG, indexG) => {
                            fieldG = { ...fieldG, allFieldsSetting: allFieldsSetting, formReadOnly: readonlyState };
                            return (
                                <Grid item {...fixColSize(fieldG)} key={indexG}>
                                    {switchField(fieldG)}
                                </Grid>
                            )
                        })}
                    </Grid>
                </Box>
            </Collapse>
        </>
    )
}
export default LineCollapse;
