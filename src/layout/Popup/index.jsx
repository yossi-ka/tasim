import React from 'react';

import { Dialog, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import Context from '../../context';

const Popup = () => {

    const { openPopup, closePopup, setOpenPopup, titlePopup, setTitlePopup, childrenPopup, setChildrenPopup, propsPopup, setPropsPopup, previousPopup, popupHistory } = React.useContext(Context);

    return (
        <Dialog fullWidth open={openPopup} {...propsPopup} sx={{ overflowY: 'hidden' }} dir='rtl'>
            <DialogTitle>{titlePopup}</DialogTitle>
            <Tooltip arrow title={popupHistory.length > 1 ? "סגירת כל הפופאפים" : "סגירת פופאפ"}>
                <IconButton onClick={() => closePopup()} sx={{ position: "absolute", top: 6, right: 6 }}>
                    <CloseIcon />
                </IconButton>
            </Tooltip>
            {popupHistory.length > 1 && <Tooltip arrow title="חזרה לפופאפ קודם">
                <IconButton onClick={() => previousPopup()} sx={{ position: "absolute", top: 6, right: 30 }}>
                    <ArrowForwardIcon />
                </IconButton>
            </Tooltip>}
            <DialogContent sx={{ overflowY: 'hidden' }}>
                {childrenPopup}
            </DialogContent>
        </Dialog>
    )
}

export default Popup;