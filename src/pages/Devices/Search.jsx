import React from "react";
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import AppSettingsAltIcon from '@mui/icons-material/AppSettingsAlt';

import Context from "../../context";
import GlobalSearch from "../../global/GlobalSearch";
import AddOrEditDevice from "./AddOrEdit";
import AddDeviceModel from "./AddDeviceModel";

const Search = ({ params, setParams, refetch, showBrokenDevices, setShowBrokenDevices, setFilteredData, allData, statuses }) => {
    const { popup } = React.useContext(Context);

    const toggleBrokenDevices = React.useCallback(() => {
        const newShowBrokenDevices = !showBrokenDevices;
        setShowBrokenDevices(newShowBrokenDevices);
        const newFilteredData = newShowBrokenDevices
            ? allData
            : allData.filter(device => device.status !== 3 && device.status !== 4);

        setFilteredData(newFilteredData);
    }, [showBrokenDevices, allData, setShowBrokenDevices, setFilteredData]);

    return <GlobalSearch
        quickSearchFields={[
            { name: 'globalSearch', label: 'חיפוש מכשירים', size: 12, variant: "outlined" }
        ]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        actions={[
            {
                title: "הוסף מכשיר חדש",
                icon: <AddIcon color='primary' />,
                onClick: () => popup({
                    title: "הוסף מכשיר חדש",
                    content: <AddOrEditDevice statuses={statuses} refetch={refetch} />,
                })
            },
            {
                title: "רענן נתונים",
                icon: <RefreshIcon color='primary' />,
                onClick: refetch
            },
            {
                title: showBrokenDevices ? "הסתר מכשירים תקולים" : "הצג הכל",
                icon: showBrokenDevices ? <VisibilityOffIcon color='primary' /> : <VisibilityIcon color='primary' />,
                onClick: toggleBrokenDevices
            },
            {
                title: "הוסף דגם",
                icon: <AppSettingsAltIcon color='primary' />,
                onClick: () => popup({
                    title: "הוסף דגם חדש",
                    content: <AddDeviceModel />,
                })
            }
        ]}
    />;
};

export default Search;