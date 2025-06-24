import React from 'react';

import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide, Button, IconButton, Typography } from '@mui/material';
import ReportIcon from '@mui/icons-material/Report';

import Context from '../../context';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const Confirm = () => {

    const { openConfirm, setOpenConfirm, objConfirm, setObjConfirm } = React.useContext(Context);

    return (
        <Dialog
            open={openConfirm}
            TransitionComponent={Transition}
            keepMounted
            sx={{ zIndex: 1400 }}
        >
            <DialogTitle color="error">
                <Typography variant='body1' align='center'>
                    <ReportIcon color='info' />
                </Typography>
            </DialogTitle>

            {objConfirm.message && <DialogContent>
                <DialogContentText>
                    {objConfirm.message}
                </DialogContentText>
            </DialogContent>}
            <DialogActions>
                <Button size='small' onClick={() => {
                    if (objConfirm.onCancel) objConfirm.onCancel();
                    setOpenConfirm(false);
                }}>ביטול</Button>
                <Button size='small' variant='contained' color="info" onClick={() => {
                    if (objConfirm.onConfirm) objConfirm.onConfirm();
                    setOpenConfirm(false);
                }}>אישור</Button>
            </DialogActions>
        </Dialog>
    );
}

export default Confirm;
