import React from 'react';

import RefreshIcon from '@mui/icons-material/Refresh';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';

import GlobalSearch from "../../global/GlobalSearch";
import Context from '../../context';
import { exportExcel } from '../../utils/excel';
import { List, ListItem, ListItemText, ListSubheader, Popover, Switch } from '@mui/material';
import AddOrUpdate from './AddOrShow';

const Search = ({ 
    dataForExcel, 
    termsForExcel, 
    params, 
    setParams, 
    viewColumn, 
    setViewColumn, 
    allColumns, 
    refetch
}) => {
    const { popup, convertArray } = React.useContext(Context);

    const [columnPopover, setColumnPopover] = React.useState(null);
    const openColumnPopover = Boolean(columnPopover);
    const handleColumnPopover = (event) => {
        setColumnPopover(event.currentTarget);
    };
    const handleChangeColumn = (name) => {
        if (viewColumn.includes(name)) {
            setViewColumn(viewColumn.filter(item => item !== name))
        } else {
            setViewColumn([...viewColumn, name])
        }
    }

    return <>
        <GlobalSearch
            quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
            quickSearchOnTyping={true}
            params={params}
            setParams={setParams}
            actions={[
                {
                    title: "הוספת חשבונית",
                    icon: <AddIcon color="primary" />,
                    onClick: () => {
                        popup({
                            content: <AddOrUpdate 
                                key={`invoice-new-${Date.now()}`} // key ייחודי
                                refetch={refetch}
                            />,
                            title: "הוספת חשבונית"
                        })
                    }
                },
                {
                    title: "רענון מסך",
                    icon: <RefreshIcon color="primary" />,
                    onClick: () => {
                        refetch()
                    }
                },
                {
                    title: "בחירת עמודות",
                    icon: <ViewColumnIcon color="primary" />,
                    onClick: (e) => {
                        handleColumnPopover(e)
                    }
                },
                {
                    title: "הפקת אקסל",
                    icon: <FileDownloadIcon color="primary" />,
                    onClick: () => {
                        exportExcel(convertArray(dataForExcel, termsForExcel), "חשבוניות", termsForExcel)
                    }
                },
            ]}
        />
        <Popover
            open={openColumnPopover}
            anchorEl={columnPopover}
            onClose={() => setColumnPopover(null)}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <List
                sx={{ width: '100%', maxWidth: 360, maxHeight: 350, bgcolor: 'background.paper' }}
                subheader={<ListSubheader>בחר עמודות</ListSubheader>}
            >
                {allColumns.map((item, index) =>
                    <ListItem key={index}>
                        <ListItemText primary={item.label} />
                        <Switch
                            edge="end"
                            onChange={() => handleChangeColumn(item.name)}
                            checked={viewColumn.includes(item.name)}
                        />
                    </ListItem>
                )}
            </List>
        </Popover>
    </>
}

export default Search;
