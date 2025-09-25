import React from 'react'

import { useNavigate } from 'react-router-dom';

// material-ui
import { Toolbar, Box, Typography, IconButton, Stack, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

import Context from '../../../context';

// ==================================|| DRAWER HEADER ||================================== //

const DrawerHeader = ({ open }) => {

    const { user } = React.useContext(Context)
    const navigate = useNavigate();

    const u = React.useMemo(() => user ? user : null, [user])

    return (
        <Toolbar>
            <Stack direction='row' alignItems='start' justifyContent='space-between' sx={{ width: 1 }}>
                <Typography variant="h5" color="primiary.dark">{u?.firstName} {u?.lastName}</Typography>
                <Tooltip title="יציאה מהחשבון" arrow>
                    <IconButton size='small' onClick={() => navigate('/login')}> <LogoutIcon /></IconButton>
                </Tooltip>
            </Stack>
        </Toolbar>
    );
};

export default DrawerHeader;
