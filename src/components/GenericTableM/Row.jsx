import React from 'react';
import { useState, useContext, useMemo } from 'react';

// material-ui
import {
    TableRow,
    TableCell,
    Collapse,
    Typography,
    ButtonGroup,
    Button,
    Tooltip,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import TooltipTypography from "./TooltipTypography"
import BooleanColView from '../TypeColView/BooleanColView';
import CopyColView from '../TypeColView/CopyColView';
import SwitchTypeRow from './SwitchTypeRow';

import { formatCurrency, formatCurrencyIL, formatMinusCurrencyIL, formatDate, formatDateTime, formatReadMore, formatMonth, formatPercent, isFunction } from '../../utils/func';
import Context from '../../context';

const Row = ({ row, index, columns, fillRow, setFillRow, selected, setSelected }) => {

    const theme = useTheme();

    const { getLookup } = useContext(Context);

    const [openCollapse, setOpenCollapse] = useState(false);
    const [objCollapse, setObjCollapse] = useState(null);
    // const [copyed, setCopyed] = useState(false);
    const isCollapsed = columns.some(column => column.collapse);
    const collapseContent = isCollapsed ? columns.find(column => column.collapse).collapse : null;
    const isFiilRow = useMemo(() => fillRow === index ? true : false, [fillRow, index]);

    return (
        <>
            <TableRow
                hover
                selected={isFiilRow}
                onClick={() => {
                    setFillRow(index);
                }}
            >
                {columns.map((c, index) => {
                    let col;
                    if (c.obj) {
                        col = c.obj(row);
                    } else {
                        col = c;
                    }
                    return (
                        <TableCell key={index}
                            sx={{
                                borderBottom: isCollapsed ? 'unset' : '',
                                bgcolor: row.isUiTableRowError ? theme.palette.error.light : (isCollapsed && openCollapse) ? theme.palette.warning.lighter : col.bgcolor ? col.bgcolor : null,
                                color: col.color ? col.color : null,
                                py: (isCollapsed && openCollapse) ? 1 : null,
                                width: (col.first) ? 50 : null,

                            }}>

                            {/* {switchRow(col)} */}
                            <SwitchTypeRow
                                col={col}
                                row={row}
                                objCollapse={objCollapse}
                                setObjCollapse={setObjCollapse}
                                openCollapse={openCollapse}
                                setOpenCollapse={setOpenCollapse}
                                index={index}
                                selected={selected}
                                setSelected={setSelected}
                            />
                        </TableCell>
                    )
                })}
            </TableRow>

            {isCollapsed && <TableRow>
                <TableCell colSpan={100} sx={{ p: openCollapse ? null : 0, fontSize: "100%", bgcolor: openCollapse ? theme.palette.warning.lighter : null }}>
                    <Collapse in={openCollapse} timeout={250} sx={{ textAlign: "left", my: openCollapse ? 2 : 0, mx: 2 }}>
                        {collapseContent(row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse)}
                    </Collapse>
                </TableCell>
            </TableRow>}
        </>
    )
}

export default Row;