import React from 'react';
import { useState, useEffect, useTransition, useMemo, useCallback } from 'react';

// material-ui
import {
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Box,
    LinearProgress,
    Typography,
    Checkbox
} from '@mui/material';


import Header from './Header';
import Row from './Row';

const GenericTable = ({ header, columns, data, title, footer, actions, selectedActions, counter, pagination, rowsPerPage, page, setPage, titleBgColor, titleColor, sticky }) => {

    const [isPending, startTransition] = useTransition();
    const [dataToShow, setDataToShow] = useState([]);
    const [isStart, setIsStart] = useState(true);
    const [selected, setSelected] = useState([]);

    // console.log(selected);

    const [fillRow, setFillRow] = useState(null);

    const isAnyFormula = useMemo(() => columns.some(col => col.formula), [columns]);

    useEffect(() => {
        // console.log("diffrent", (counter / rowsPerPage) % 10);
        setIsStart(false);
        startTransition(() => {
            setDataToShow(data);
        });
        if ((counter / rowsPerPage) % 10 === 1) {
            setPage(0);
        }
    }, [data]);

    const count = () => {
        if (!counter) return false;
        if (typeof counter === 'boolean' && counter) return dataToShow.length || 0;
        return counter;
    }

    const countForPagination = () => {
        if (!pagination) return 0;
        if (!counter) return dataToShow ? dataToShow.length : 0;
        return Number(counter);
    }

    // formula function with useCallBack
    const formula = useCallback((formula, key) => {
        switch (formula) {
            case "sum":
                return dataToShow.reduce((acc, curr) => acc + curr[key], 0);
            case "avg":
                return dataToShow.reduce((acc, curr) => acc + curr[key], 0) / dataToShow.length;
            case "count":
                return dataToShow.length;
            default:
                return null;
        }
    }, [dataToShow]);

    return (
        <>
            {(title || actions || counter || (selectedActions && (selected && selected.length > 0))) && <Header
                title={title}
                actions={actions}
                selectedActions={selectedActions}
                selected={selected}
                setSelected={setSelected}
                count={count()}
                countForPagination={countForPagination()}
                rowsPerPage={rowsPerPage}
                page={page}
                setPage={setPage}
            />}
            <TableContainer sx={{ height: sticky ? window.innerHeight * 0.70 : null, pb: sticky ? 15 : null }}>
                <Table stickyHeader={sticky} size="small">
                    <TableHead>
                        <TableRow>
                            {columns.find(x => x.first) ?
                                <TableCell key={"checkbox"} sx={{ bgcolor: titleBgColor, color: titleColor }}>
                                    {columns.find(x => x.first).checkbox && <Checkbox
                                        size="small"
                                        sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                                        checked={(selected && dataToShow) && selected.length == dataToShow.filter(row => {
                                            const disabled = columns.find(row => row.first).first.checkbox.disabled;
                                            if (!disabled) return true;
                                            return isFunction(disabled) ? !disabled({ row }) : !disabled;
                                        }).length ? true : false}
                                        // disabled={columns.find(x => x.first).first.checkbox.disabled || !dataToShow}
                                        disabled={dataToShow.filter(row => {
                                            const disabled = columns.find(row => row.first).first.checkbox.disabled;
                                            if (!disabled) return true;
                                            return isFunction(disabled) ? !disabled({ row }) : !disabled;
                                        }).length == 0 ? true : false}
                                        onChange={(e, v) => {
                                            //filter data to show and remove data that the disabled is true
                                            let data = dataToShow.filter(row => {
                                                const disabled = columns.find(row => row.first).first.checkbox.disabled;
                                                if (!disabled) return true;
                                                return isFunction(disabled) ? !disabled({ row }) : !disabled;
                                            });
                                            if (v) { setSelected(data) }
                                            else { setSelected([]) }
                                        }}
                                    />}
                                </TableCell> : <></>}
                            {columns.filter(c => !c.first).map((column, index) => (
                                <TableCell key={index} sx={{ bgcolor: titleBgColor, color: titleColor }}>
                                    {isFunction(column.label) ? column.label(setDataToShow) : column.label}
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
                                <Row key={index} index={index} row={row} columns={columns} fillRow={fillRow} setFillRow={setFillRow} selected={selected} setSelected={setSelected} />
                            )
                        })}
                        {isAnyFormula && <TableRow>
                            {columns.map((col, index) => (
                                <TableCell key={index} sx={{ bgcolor: "warning.lighter" }}>
                                    {col.formula && <Box>
                                        <Typography variant="body2" sx={{ fontSize: "100%", mb: -1, pb: -1 }}>{col.formula?.cb(formula(col.formula?.type, col.key))}</Typography>
                                        <Typography variant="caption" color="secondary.400" sx={{ fontSize: "80%" }}>{col.formula?.caption}</Typography>
                                    </Box>}
                                </TableCell>
                            ))}
                        </TableRow>}
                    </TableBody>
                </Table>
                {footer ? footer : null}
            </TableContainer>
        </>
    )
}

GenericTable.defaultProps = {
    title: null,
    footer: null,
    actions: null,
    selectedActions: null,
    counter: null,
    pagination: false,
    rowsPerPage: 50,
    page: 0,
    setPage: null,
    titleBgColor: null,
    titleColor: null,
    sticky: false,
}

export default GenericTable;

//check if is string
function isString(value) {
    return typeof value === 'string' || value instanceof String;
}

// check if is function
function isFunction(value) {
    return typeof value === 'function';
}
