import React from 'react';
import { useState, useContext } from 'react';

import {

    TableRow,
    TableCell,
    Collapse,
    Stack,
    Typography,
    ButtonGroup,
    Button,
    Tooltip,
    Checkbox,
    Chip,
    IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DateRangeIcon from '@mui/icons-material/DateRange';

import {
    formatCurrency,
    formatCurrencyIL,
    formatMinusCurrencyIL,
    formatDate,
    formatDateTime,
    formatReadMore,
    formatMonth,
    formatPercent,
    isFunction,
    isArray
} from '../../utils/func';
import Context from '../../context';
import ActionBtn from './ActionBtn';
import TooltipTypography from './TooltipTypography';

const Row = ({ row, index, columns, fillRow, setFillRow, isDense, statuses, onRowClick }) => {

    const theme = useTheme();

    const { getLookup } = useContext(Context);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const arrowRef = React.useRef(null);

    const handleClick = (event) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'simple-popper' : undefined;

    const [openCollapse, setOpenCollapse] = useState(false);
    const [objCollapse, setObjCollapse] = useState(null);
    const [copyed, setCopyed] = useState(false);
    const isCollapsed = columns.some(column => column.collapse);
    const collapseContent = isCollapsed ? columns.find(column => column.collapse).collapse : null;

    const isFiilRow = React.useMemo(() => fillRow == index ? true : false, [fillRow, index]);

    const actionDisabled = (action) => {
        if (action.disabled) {
            if (typeof action.disabled === 'function') {
                if (action.disabled(row)) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return action.disabled;
    }

    const actionLabel = (action) => {
        if (action.label) {
            if (typeof action.label === 'function') {
                return action.label(row);
            } else {
                return action.label;
            }
        }
        return "";
    }

    const switchRow = (col) => {
        if (col.key) {
            switch (col.type) {
                case "numberText":
                    if (row[col.key] === null || row[col.key] === undefined || row[col.key] === "" || row[col.key] == 0) return "-";
                    return row[col.key];
                case "date":
                    if (row[col.key] === null || row[col.key] === undefined || row[col.key] === "") return "-";
                    let print = formatDate(row[col.key]);
                    if (!print) {
                        if (row[col.key].toDate) print = formatDate(row[col.key].toDate());
                        else return "-";
                    }
                    return <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ width: 1, height: 1 }}>
                        <CalendarMonthIcon color='primary' sx={{ fontSize: 12 }} />
                        <Typography variant="body2" color="secondary.main">{print}</Typography>
                    </Stack>
                case "month":
                    if (row[col.key] === null || row[col.key] === undefined || row[col.key] === "") return "-";
                    return <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ width: 1, height: 1 }}>
                        <DateRangeIcon color='primary' sx={{ fontSize: 12 }} />
                        <Typography variant="body2" color="secondary.main">{formatMonth(row[col.key])}</Typography>
                    </Stack>
                case "timeSpan":
                    if (row[col.key] === null || row[col.key] === undefined || row[col.key] === "") return "-";
                    let time = row[col.key].length == 5 ? "0" + row[col.key] : row[col.key];
                    let hours = time.substring(0, 2);
                    let minutes = time.substring(2, 4);
                    let seconds = time.substring(4, 6);
                    return <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ width: 1, height: 1 }}>
                        <AccessTimeIcon color='primary' sx={{ fontSize: 12 }} />
                        <Typography variant="body2" color="secondary.main" sx={{ letterSpacing: 1 }}>
                            {`${hours}:${minutes}:${seconds}`}
                        </Typography>
                    </Stack>
                case "datetime":
                    if (row[col.key] === null || row[col.key] === undefined || row[col.key] === "") return "-";
                    return <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center" sx={{ width: 1, height: 1 }}>
                        <AccessTimeIcon color='primary' sx={{ fontSize: 12 }} />
                        <Typography variant="body2" color="secondary.main">{row[col.key].toDate ? formatDateTime(row[col.key].toDate()) : formatDateTime(row[col.key])}</Typography>
                    </Stack>
                case "currency":
                    return formatCurrency(row[col.key]);
                case "currencyColor":
                    let toFixed = col.toFixed ? col.toFixed : 2;
                    if (row[col.key] > 0) return <Typography variant="body1" color="success.main"><strong>{formatCurrency(row[col.key], toFixed)}</strong></Typography>;
                    if (row[col.key] < 0) return <Typography variant="body1" color="error.main"><strong>{formatCurrency(row[col.key], toFixed)}</strong></Typography>;
                    else return <Typography variant="body2" color="secondary.main"><strong>{formatCurrency(row[col.key], toFixed)}</strong></Typography>;
                case "currencyIL":
                    return formatCurrencyIL(row[col.key]);
                case "minusCurrencyIL":
                    return formatMinusCurrencyIL(row[col.key]);
                case "percent":
                    return formatPercent(row[col.key]);
                case "percentColor":
                    if (row[col.key] > 0) return <Typography variant="body2" color="success.main">{formatPercent(row[col.key])}</Typography>;
                    if (row[col.key] < 0) return <Typography variant="body2" color="error.main">{formatPercent(row[col.key])}</Typography>;
                    else return <Typography variant="body2" color="secondary.main">{formatPercent(row[col.key])}</Typography>;
                case "lookup":
                    if (row[col.key] == null || row[col.key] == undefined || row[col.key] == "" || row[col.key] == 0) return "-";
                    let l = getLookup(col.lookup).find(item => item.value === row[col.key]);
                    return l ? l.label : "-";
                case "boolean":
                    if (row[col.key] == null) return <Typography variant="body2" color="error">✗</Typography>;
                    if ((row[col.key] == undefined || row[col.key] == "") && row[col.key] != 0) return "-";
                    const v = <Typography variant="body2" color="success.main">✓</Typography>;
                    const x = <Typography variant="body2" color="error">✗</Typography>;
                    switch (row[col.key]) {
                        case true:
                            return v;
                        case false:
                            return x;
                        case 'true':
                            return v;
                        case 'false':
                            return x;
                        case 'כן':
                            return v;
                        case 'לא':
                            return x;
                        case '1':
                            return v;
                        case '0':
                            return x;
                        case 1:
                            return v;
                        case 0:
                            return x;
                        default:
                            return row[col.key];
                    }
                case "small":
                    return <span style={{ fontSize: "85%" }}>{row[col.key]}</span>;
                case "readmore":
                    return <Tooltip title={row[col.key] || ''} arrow>
                        <Typography variant="body2">{formatReadMore(row[col.key])}</Typography>
                    </Tooltip>;
                case "readmore-copy":
                    return <Tooltip title={
                        <>
                            <Typography variant="body1">
                                {copyed ? "הועתק ללוח !" : "ניתן ללחוץ כדי להעתיק:"}
                            </Typography>
                            <Typography variant="body2">{row[col.key]}</Typography>
                        </>
                    } arrow>
                        <Button
                            variant="text"
                            color="primary"
                            size="small"
                            sx={{ fontSize: '95%', m: 0, p: 0 }}
                            onClick={() => {
                                navigator.clipboard.writeText(row[col.key]);
                                setCopyed(true);
                                setTimeout(() => {
                                    setCopyed(false);
                                }, 2000);
                            }}
                        >
                            {formatReadMore(row[col.key])}
                        </Button>
                    </Tooltip>;
                case "copy":
                    return <Tooltip title={
                        <>
                            <Typography variant="body1">
                                {copyed ? "הועתק ללוח !" : "ניתן ללחוץ כדי להעתיק"}
                            </Typography>
                        </>
                    } arrow>
                        <Button
                            variant="text"
                            color="primary"
                            size="small"
                            sx={{ fontSize: '95%', m: 0, p: 0 }}
                            onClick={() => {
                                navigator.clipboard.writeText(row[col.key]);
                                setCopyed(true);
                                setTimeout(() => {
                                    setCopyed(false);
                                }, 2000);
                            }}
                        >
                            {row[col.key]}
                        </Button>
                    </Tooltip>;
                case "lookup-array":
                    if (!row[col.key] || !isArray(row[col.key]) || row[col.key].length == 0) return "";
                    // else if (row[col.key].length == 1) return getLookup(col.lookup).find(item => item.value === row[col.key][0])?.label;
                    else return row[col.key].map((item, index) => {
                        return <Chip key={index} size='small' label={getLookup(col.lookup).find(l => l.value === item)?.label} sx={{ m: 0.1, p: 0 }} />
                    });
                default:
                    return row[col.key];
            }
        }
        if (col.cb) return col.cb(row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse);
        if (col.tooltipTypography) return <TooltipTypography row={row} label={col.tooltipTypography.label} data={col.tooltipTypography.data} />

        if (col.iconBtn) {
            return (
                <IconButton
                    onClick={() => col.onClick(row, setOpenCollapse, openCollapse)}
                    color="primary">
                    {col.iconBtn}
                </IconButton>
            )
        }
        if (col.actions) {
            return (
                <ButtonGroup size='small'>
                    {col.actions.map((action, index) => (
                        <Button
                            key={index}
                            variant="outlined"
                            color="primary"
                            disabled={actionDisabled(action)}
                            onClick={() => action.onClick(row, setOpenCollapse)}
                            endIcon={action.icon ? action.icon : null}
                            sx={{ py: 0, fontSize: "85%" }}
                        >
                            {actionLabel(action)}
                        </Button>
                    ))}
                </ButtonGroup>
            )
        }
        if (col.actionBtn) {
            return (
                <ActionBtn isDense={isDense} actionsArr={isFunction(col.actionBtn) ? col.actionBtn({ row, setOpenCollapse, openCollapse }) : col.actionBtn} row={row} setOpenCollapse={setOpenCollapse} openCollapse={openCollapse} />
            )
        }
        if (col.checkbox) {
            return (
                <Checkbox
                    size={isDense ? "small" : "medium"}
                    checked={col.checked(row)}
                    color={col.color ? col.color : "primary"}
                    onChange={(e) => col.onChange(e, row)}
                />
            )
        }
        if (col.status) {
            let s = statuses.find(s => col.status(row) === s.key);
            if (!s) return null;
            return (
                <Chip
                    size={isDense ? "small" : "medium"}
                    label={s.label}
                    sx={{
                        bgcolor: theme.palette[s.color][100],
                        color: theme.palette[s.color][700]
                    }}
                />
            )
        }

        return row[col.key];
    }

    return (
        <>
            <TableRow
                hover
                selected={isFiilRow}
                onClick={() => {
                    setFillRow(index);
                }}
            >
                {columns.map((col, index) => (
                    <TableCell key={index}
                        onClick={() => {
                            if (onRowClick && (col.type && col.type != 'copy')) onRowClick(row);
                        }}
                        sx={{
                            borderBottom: isCollapsed ? 'unset' : '',
                            bgcolor: (isCollapsed && openCollapse) ? theme.palette.warning.lighter : col.bgcolor ? col.bgcolor : null,
                            color: col.color ? col.color : null,
                            py: (isCollapsed && openCollapse) ? 1 : isDense ? 0.5 : null,
                            width: (col.actionBtn || col.checkbox) ? 75 : null,
                            cursor: onRowClick && (!col.type || col.type != 'copy') ? 'pointer' : null
                        }}>
                        {switchRow(col)}
                    </TableCell>
                ))}
            </TableRow>
            {(isCollapsed && openCollapse) && <TableRow>
                <TableCell colSpan={26} sx={{ fontSize: "100%", bgcolor: openCollapse ? theme.palette.warning.lighter : null }}>
                    <Collapse in={openCollapse} timeout={250} sx={{ textAlign: "left", my: openCollapse ? 2 : 0, mx: 2 }}>
                        {collapseContent(row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse)}
                    </Collapse>
                </TableCell>
            </TableRow>}
        </>
    )
}
export default Row;