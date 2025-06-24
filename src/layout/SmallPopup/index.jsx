import React from 'react';

import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import Context from '../../context';

const SmallPopup = () => {

    const { openSmallPopup, closeSmallPopup, setOpenSmallPopup, titleSmallPopup, setTitleSmallPopup, childrenSmallPopup, setChildrenSmallPopup, propsSmallPopup, setPropsSmallPopup} = React.useContext(Context);

    return (
        <Dialog fullWidth open={openSmallPopup} {...propsSmallPopup}>
            <DialogTitle>{titleSmallPopup}</DialogTitle>
            <IconButton onClick={() => closeSmallPopup()} sx={{ position: "absolute", top: 6, right: 6 }}>
                <CloseIcon />
            </IconButton>
            <DialogContent>
                {childrenSmallPopup}
            </DialogContent>
        </Dialog>
    )
}

export default SmallPopup;