import React from 'react';

export const usePopups = () => {

    const [openConfirm, setOpenConfirm] = React.useState(false);
    const [objConfirm, setObjConfirm] = React.useState(false);
    const confirm = (obj) => {
        setObjConfirm(obj);
        setOpenConfirm(true);
    };

    const [popupHistory, setPopupHistory] = React.useState([]);
    const [openPopup, setOpenPopup] = React.useState(false);
    const [propsPopup, setPropsPopup] = React.useState({}); // props
    const [titlePopup, setTitlePopup] = React.useState('פופאפ');
    const [childrenPopup, setChildrenPopup] = React.useState(null); // content
    const closePopupCallback = React.useRef(null);
    const popup = ({ title, content, props, onClose, size }, isPrevious = false) => {

        if (!isPrevious) setPopupHistory([...popupHistory, { title, content, props, onClose, size }]);

        let propsObj = props ? props : {};
        if (size) propsObj.maxWidth = size;

        setPropsPopup(propsObj);
        setTitlePopup(title ? title : 'פופאפ');
        setChildrenPopup(content ? content : null);
        setOpenPopup(true);

        if (closePopupCallback.current) closePopupCallback.current();
        closePopupCallback.current = onClose ? onClose : null;
    };
    const previousPopup = () => {
        if (popupHistory.length > 1) {
            let lastPopup = popupHistory[popupHistory.length - 2];
            setPopupHistory(old => old.filter((item, index) => index < old.length - 1));
            popup(lastPopup, true);
        }
    }
    const closePopup = () => {
        setPopupHistory([]);
        if (closePopupCallback.current !== null) {
            closePopupCallback.current();
        }
        setOpenPopup(false);
    };
    React.useEffect(() => {
        if (!openPopup && popupHistory.length === 0) {
            setPropsPopup({});
            setTitlePopup('פופאפ');
            setChildrenPopup(null);
        }
    }, [openPopup]);

    const [openSmallPopup, setOpenSmallPopup] = React.useState(false);
    const [propsSmallPopup, setPropsSmallPopup] = React.useState({}); // props
    const [titleSmallPopup, setTitleSmallPopup] = React.useState('פופאפ');
    const [childrenSmallPopup, setChildrenSmallPopup] = React.useState(null); // content
    const closePopupSmallCallback = React.useRef(null);
    const smallPopup = ({ title, content, props, onClose }) => {
        setPropsSmallPopup(props)
        setTitleSmallPopup(title);
        setChildrenSmallPopup(content);
        setOpenSmallPopup(true);
        closePopupSmallCallback.current = onClose ? onClose : null;
    };
    const closeSmallPopup = () => {
        if (closePopupSmallCallback.current !== null) {
            closePopupSmallCallback.current();
        }
        setOpenSmallPopup(false);
    };
    React.useEffect(() => {
        if (!openSmallPopup) {
            setPropsSmallPopup({});
            setTitleSmallPopup('פופאפ');
            setChildrenSmallPopup(null);
        }
    }, [openSmallPopup]);


    return {
        openConfirm, setOpenConfirm, objConfirm, setObjConfirm, confirm,
        popup, closePopup, openPopup, setOpenPopup, titlePopup, setTitlePopup, childrenPopup, setChildrenPopup, propsPopup, setPropsPopup, previousPopup, popupHistory,
        smallPopup, closeSmallPopup, openSmallPopup, setOpenSmallPopup, titleSmallPopup, setTitleSmallPopup, childrenSmallPopup, setChildrenSmallPopup, propsSmallPopup, setPropsSmallPopup
    }

}
export default usePopups;