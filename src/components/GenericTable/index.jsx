import React from 'react';
import { useState, useEffect, useTransition } from 'react';

// material-ui
import {
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Stack,
    Box,
    LinearProgress,
    Typography,
    Card,
    Divider,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { useTheme } from '@mui/material/styles';
import LoadingData from '../../components/LoadingData';
import StatusFilter from './StatusFilter';
import Row from './Row';
import Footer from './Footer';
import Header from './Header';
import { isArray } from '../../utils/func';
import Context from '../../context';




const GenericTable = ({ columns, data, loading, height, tableHeight, customHeight, title, noData, header, footer, statuses, statusBarHandleChange, actions, counter, pagination, innerPagination, rowsPerPage, page, setPage, titleBgColor, titleColor, onRowClick, setPageWhenDataChanged }) => {

    const theme = useTheme();
    const { getLookupName } = React.useContext(Context);

    const [isPending, startTransition] = useTransition();
    const [dataToShow, setDataToShow] = useState([]);
    const [isStart, setIsStart] = useState(true);

    const [fillRow, setFillRow] = useState(null);

    const [isDense, setIsDense] = useState(true);

    const [heights, setHeights] = useState({});

    const [innerPage, setInnerPage] = useState(0);

    const [sortType, setSortType] = useState({
        column: null,
        type: null
    });
    const [sortedData, setSortedData] = useState(data);

    React.useEffect(() => {
        if (sortType.column) {
            const column = columns.find((c) => c.key === sortType.column);
            const newSortedData = [...data].sort((a, b) => {
                let aVal = a[sortType.column];
                let bVal = b[sortType.column];

                if (column.type === "date") {
                    if (aVal?.toDate) aVal = aVal.toDate();
                    if (bVal?.toDate) bVal = bVal.toDate();
                    aVal = new Date(aVal || null);
                    bVal = new Date(bVal || null);
                } else if (column.type === "lookup") {
                    aVal = getLookupName(column.lookup, aVal);
                    bVal = getLookupName(column.lookup, bVal);
                }

                if (sortType.type === "asc") {
                    return aVal != null || aVal > bVal ? 1 : -1;
                } else {
                    return aVal == null || aVal < bVal ? 1 : -1;
                }
            });
            setSortedData(newSortedData);
        } else {
            setSortedData(data);
        }
    }, [sortType, data]);


    // const windowHeight = React.useMemo(() => window.innerHeight, []);
    useEffect(() => {
        const defaultHeight = {
            container: null,
            tableContent: null,
            header: null,
            footer: null,
        }
        if (customHeight) {
            const newHeights = {
                ...defaultHeight,
                ...customHeight,
                container: customHeight.container ? customHeight.container < 1 ?
                    customHeight.container * window.innerHeight : customHeight.container :
                    defaultHeight.container,
            }
            setHeights({ ...defaultHeight, ...newHeights });
        } else if (height) {
            if (height == "main")
                setHeights({
                    container: window.innerHeight * 0.88,
                    tableContent: 0.94,
                    header: null,
                    footer: null //0.05,
                })
            else if (height == "tabs")
                setHeights({
                    container: window.innerHeight * 0.83,
                    header: null,
                    tableContent: 0.94,
                    footer: null,
                })
            else setHeights({ ...defaultHeight, container: height, tableContent: tableHeight ? tableHeight : 0.8 });

        } else {
            setHeights(defaultHeight);
        }
    }, [height, customHeight, tableHeight]);


    useEffect(() => {
        setIsStart(false);
        startTransition(() => {
            if (innerPagination && isArray(sortedData)) {
                setDataToShow(sortedData.slice(innerPage * rowsPerPage, (innerPage + 1) * rowsPerPage));
            } else {
                setDataToShow(sortedData);
            }
        });
    }, [sortedData, innerPage, rowsPerPage, startTransition, innerPagination]);

    useEffect(() => {
        if (innerPagination && isArray(sortedData) && (setPageWhenDataChanged || sortedData.length < (rowsPerPage * (innerPage + 1)))) {
            setInnerPage(0);
        }
    }, [sortedData, innerPagination, setPageWhenDataChanged]);


    const count = () => {
        if (innerPagination && isArray(data)) return data.length;
        if (!counter) return false;
        if (typeof counter === 'boolean' && counter) return dataToShow.length || 0;
        return counter;
    }

    const countForPagination = () => {
        if (innerPagination && isArray(data)) return data.length;
        if (!pagination) return 0;
        if (!counter) return dataToShow ? dataToShow.length : 0;
        return Number(counter);
    }



    return (
        <Card elevation={0} sx={{ boxShadow: theme.customShadows.z2, borderRadius: 3, height: heights.container }}>
            <Stack direction="column" spacing={0} sx={{ width: 1, height: 1 }}>
                <Stack direction="column" sx={{ width: 1, height: heights.tableContent }}>

                    {(statuses || title || actions) && <StatusFilter
                        count={countForPagination()}
                        statuses={statuses}
                        statusBarHandleChange={statusBarHandleChange}
                        title={title}
                        isData={dataToShow && dataToShow.length > 0}
                        actions={actions}
                        height={heights.header} />}
                    {header && <Header
                        header={header}
                    />}
                    <TableContainer sx={{
                        height: heights.tableContent //height
                        // ? tableHeight
                        // : counter
                        //     ? window.innerHeight * ((dataToShow && dataToShow.length > 0 && (statuses || title)) ? 0.75 : 0.80)
                        //     : null
                    }}>
                        {loading && <LoadingData height={heights.tableContent} />}
                        {(dataToShow && dataToShow.length === 0 && !loading) && <Stack direction="column" alignItems="center" spacing={1} justifyContent="center"
                            sx={{ width: 1, height: 1 }}>
                            {noData}
                            {!noData && <SearchOffIcon color='secondary' sx={{ fontSize: counter ? 75 : 50 }} />}
                            {!noData && <Typography variant={counter ? "h1" : "h3"} component='p' sx={{ color: theme.palette.text.secondary }}>
                                לא נמצאו {title ? title : "נתונים"}
                            </Typography>}
                        </Stack>}
                        {(dataToShow && dataToShow.length > 0 && !loading) && <Table stickyHeader size="small">

                            <TableHead>
                                <TableRow>
                                    {columns.map((column, index) => (
                                        <TableCell key={index} sx={{ bgcolor: titleBgColor, color: titleColor }}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-around"
                                                sx={{ cursor: !column.cb ? "pointer" : "default" }}
                                                onClick={() => {
                                                    if (!column.cb) {
                                                        if (sortType.column === column.key) {
                                                            setSortType({ column: column.key, type: sortType.type === "asc" ? "desc" : "asc" });
                                                        } else {
                                                            setSortType({ column: column.key, type: "asc" });
                                                        }
                                                    }
                                                }}>
                                                {isFunction(column.label) ? column.label(setDataToShow) : column.label}
                                                {sortType.column == column.key && sortType.type == "asc" && <ArrowDropUpIcon
                                                    onClick={() => setSortType({ column: column.key, type: "asc" })}
                                                />}
                                                {sortType.column == column.key && sortType.type == "desc" && <ArrowDropDownIcon
                                                    onClick={() => setSortType({ column: column.key, type: "desc" })}
                                                />}
                                            </Stack>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {(isPending || isStart) && <TableRow>
                                    <TableCell colSpan={1000}>
                                        <Box sx={{ width: '50%', m: "50px auto" }}>
                                            <LinearProgress />
                                        </Box>
                                    </TableCell>
                                </TableRow>}
                                {(dataToShow && !isPending && !isStart) && dataToShow.map((row, index) => {
                                    return (
                                        <Row key={index} index={index} row={row} columns={columns} fillRow={fillRow} setFillRow={setFillRow} isDense={isDense} statuses={statuses} onRowClick={onRowClick} />
                                    )
                                })}
                            </TableBody>

                        </Table>}
                        {footer}
                    </TableContainer>
                </Stack>

                <Divider />
                {(pagination || innerPagination) && <Box sx={{ height: heights.footer, justifySelf: "end" }} >
                    <Footer
                        // height={1}
                        count={count()}
                        countForPagination={countForPagination()}
                        rowsPerPage={rowsPerPage}
                        page={innerPagination ? innerPage : page}
                        setPage={innerPagination ? setInnerPage : setPage}
                        isDense={isDense}
                        setIsDense={setIsDense}
                    />
                </Box>}
            </Stack>
        </Card>
    )
}

GenericTable.defaultProps = {
    loading: false,
    height: null,
    tableHeight: 0.65,
    title: null,
    noData: null,
    header: null,
    footer: null,
    statuses: null,
    statusBarHandleChange: null,
    actions: null,
    counter: null,
    pagination: false,
    rowsPerPage: 50,
    page: 0,
    setPage: null,
    titleBgColor: null,
    titleColor: null,
    onRowClick: null,
    customHeight: null,
    setPageWhenDataChanged: true
}

export default GenericTable;

/* statuses example = [
    { key: 1, label: "פעיל", color: "success" },
] */


// check if is function
function isFunction(value) {
    return typeof value === 'function';
}
