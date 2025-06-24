import React from "react";

import Context from "./index";

// import LoadingData from "../components/LoadingData";

import useLookup from "./hooks/lookup/useLookup";
import usePopups from "./hooks/popups";
import useAuth from "./hooks/auth/useAuth";

const ContextProvider = ({ children }) => {

    const [openSnackbar, setOpenSnackbar] = React.useState(false);
    const [snackbarTitle, setSnackbarTitle] = React.useState(null);
    const [snackbarMessageType, setSnackbarMessageType] = React.useState("success");
    const [snackbarMessage, setSnackbarMessage] = React.useState("");

    const snackbar = (message = "Message", type = 'success', title = null) => {
        setSnackbarMessageType(type);
        setSnackbarMessage(message);
        setOpenSnackbar(true);
        setSnackbarTitle(title);
    }
    const { user, restartUser } = useAuth();
    const [selectdeKupa, setSelectedKupa] = React.useState(null);

    const { getLookup, lookupIsLoading, getLookupName, getLookupCode, convertArray } = useLookup();
    const popups = usePopups();

    const store = {
        openSnackbar,
        setOpenSnackbar,
        snackbarMessage,
        snackbarMessageType,
        snackbarTitle,
        snackbar,
        ...popups,
        getLookup,
        getLookupName,
        getLookupCode,
        convertArray,
        user,
        restartUser,
        selectdeKupa,
        setSelectedKupa
    }

    // if (lookupIsLoading) {
    //     return <LoadingData />
    // }

    return (
        <Context.Provider value={store}>
            {children}
        </Context.Provider>
    );
}
export default ContextProvider;