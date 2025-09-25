import React, { useEffect, useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Toolbar, useMediaQuery, Alert, Snackbar, Typography, AlertTitle, Button } from '@mui/material';

// project import
import Drawer from './Drawer';
import Header from './Header';
// import Popups from '../../popups';
import Confirm from './Confirm';
import Popup from './Popup';
import SmallPopup from './SmallPopup';
import Context from '../context';
import LoadingData from '../components/LoadingData';

// import LoadingData from '../../components/LoadingData';

// ==================================|| MAIN LAYOUT ||================================== //

const Layout = () => {
    const theme = useTheme();
    const matchDownLG = useMediaQuery(theme.breakpoints.down('xl'));
    const { authData } = useContext(Context);

    // const navigate = useNavigate();
    // React.useEffect(() => {
    //     console.log(authData);
    //     if (authData === null) {
    //         navigate('/login');
    //     }
    // }, [authData]);


    const [open, setOpen] = useState(false);
    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    // set media wise responsive drawer
    useEffect(() => {
        setOpen(!matchDownLG);
    }, [matchDownLG]);

    /* Snackbar */
    const { openSnackbar, setOpenSnackbar, snackbarMessage, snackbarMessageType, snackbarTitle, openConfirm, openPopup, openSmallPopup, user } = useContext(Context);
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenSnackbar(false);
    };


    if (user === 'loading' || user === null) return <LoadingData />

    return (
        <>
            {openConfirm && <Confirm />}
            {openPopup && <Popup />}
            {openSmallPopup && <SmallPopup />}

            {/* <Popups /> */}
            <Box sx={{ display: 'flex', width: '100%' }}>
                <Header open={open} handleDrawerToggle={handleDrawerToggle} />
                <Drawer open={open} handleDrawerToggle={handleDrawerToggle} />
                <Box component="main" sx={{ width: '80%', flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                    <Toolbar />
                    <Snackbar
                        open={openSnackbar}
                        autoHideDuration={snackbarTitle === null ? 5000 : 1000}
                        onClose={handleClose}
                    >
                        <Alert
                            onClose={handleClose}
                            severity={snackbarMessageType}
                            variant={snackbarTitle === null ? "filled" : "outlined"}
                            sx={{ width: '100%' }}
                        >
                            {snackbarTitle !== null && <AlertTitle>{snackbarTitle}</AlertTitle>}
                            <Typography variant={snackbarTitle === null ? "h6" : "h4"}>{snackbarMessage}</Typography>
                        </Alert>
                    </Snackbar>
                    <Outlet />
                </Box>
            </Box>
        </>
    );
};

export default Layout;
