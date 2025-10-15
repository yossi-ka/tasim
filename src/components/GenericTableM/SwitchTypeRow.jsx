import React from 'react';
import { useContext } from 'react';

// material-ui
import {
    Typography,
    Tooltip,
    ButtonGroup,
    Checkbox,
    Button,
    Stack,
    IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { formatCurrency, formatCurrencyIL, formatMinusCurrencyIL, formatDate, formatDateTime, formatReadMore, formatMonth, formatPercent, isFunction } from '../../utils/func';
import Context from '../../context';
import BooleanColView from '../TypeColView/BooleanColView';
import CopyColView from '../TypeColView/CopyColView';
import TooltipTypography from "./TooltipTypography";
import ActionBtn from './ActionBtn';


const SwitchTypeRow = ({ col, row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse, selected, setSelected }) => {

    const { getLookup } = useContext(Context);

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

    const actionVariant = (action) => {
        if (action.variant) {
            if (typeof action.variant === 'function') {
                return action.variant({ row, index, openCollapse, objCollapse });
            } else {
                return action.variant;
            }
        }
        return "outlined";
    }

    const isCheckd = (checkd, row, idKey) => {
        if (checkd) {
            if (isFunction(checkd)) {
                return checkd(row);
            }
            return checkd;
        }
        else {
            var indexInSelectedRow = selected.find(x => x[idKey] == row[idKey]);
            return indexInSelectedRow ? true : false;
        }
    }

    const switchRow = (col) => {
        if (col.key) {

            let value = '';
            if (isFunction(col.key)) {
                value = col.key(row);
            } else {
                value = row[col.key];
            }

            switch (col.type) {
                case "date":
                    if (value === null || value === undefined || value === "") return "-";
                    return formatDate(value);
                case "month":
                    if (value === null || value === undefined || value === "") return "-";
                    return formatMonth(value);
                case "datetime":
                    if (value === null || value === undefined || value === "") return "-";
                    return formatDateTime(value);
                case "currency":
                    return formatCurrency(value);
                case "currencyIL":
                    return formatCurrencyIL(value);
                case "minusCurrencyIL":
                    return formatMinusCurrencyIL(value);
                case "currencyColor":
                    if (row[col.key] > 0) return <Typography variant="body1" color="success.main"><strong>{formatCurrency(row[col.key])}</strong></Typography>;
                    if (row[col.key] < 0) return <Typography variant="body1" color="error.main"><strong>{formatCurrency(row[col.key])}</strong></Typography>;
                    else return <Typography variant="body2" color="secondary.main"><strong>{formatCurrency(row[col.key])}</strong></Typography>;
                case "percent":
                    return formatPercent(value);
                case "lookup":
                    if (value == null || value == undefined || value == "") return "-";
                    const v = getLookup(col.lookup).find(item => item.value == value)
                    return v ? v.label : '-';
                // return value;
                case "boolean":
                    return <BooleanColView value={value} />
                case "small":
                    return <span style={{ fontSize: "85%" }}>{value}</span>;
                case "readmore":
                    return <Tooltip title={value || ''} arrow>
                        <Typography variant="body2">{formatReadMore(value, 50, true)}</Typography>
                    </Tooltip>;
                case "readmore-copy":
                    if (value == null || value == undefined || value == "") return "-";
                    return <CopyColView isReadMore={true} value={value} />
                case "copy":
                    return <CopyColView isReadMore={false} value={value} />
                default:
                    return value;
            }
        }
        if (col.iconBtn) {
            return (
                <IconButton
                    onClick={() => col.onClick(row, setOpenCollapse, openCollapse)}
                    color="primary">
                    {col.iconBtn}
                </IconButton>
            )
        }
        if (col.cb) return col.cb(row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse);
        if (col.tooltipTypography) return <TooltipTypography row={row} label={col.tooltipTypography.label} data={col.tooltipTypography.data} />
        // first example { checkbox: {}, add: {} }
        if (col.first) {
            return (
                <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.5} sx={{ width: 1, height: 1 }}>
                    {col.first.collapseBtn && <Tooltip arrow title={col.first.collapseBtn.title}>
                        <IconButton
                            color={(openCollapse) ? 'primary' : 'default'}
                            size='small'
                            disabled={!col.first.collapseBtn.disabled ? false : isFunction(col.first.collapseBtn.disabled) ? col.first.collapseBtn.disabled(row) : col.first.collapseBtn.disabled}
                            onClick={() => {
                                setOpenCollapse(openCollapse => !openCollapse);
                            }}
                        >
                            <AddIcon fontSize='small' />
                        </IconButton>
                    </Tooltip>
                    }
                    {col.first.checkbox && <Checkbox
                        size="small"
                        sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                        checked={isCheckd(col.first.checkbox.checked, row, col.first.checkbox.idKey)}
                        disabled={isFunction(col.first.checkbox.disabled) ? col.first.checkbox.disabled({ row }) : col.first.checkbox.disabled}
                        onChange={(e, v) => {
                            if (col.first.checkbox.onChange) {
                                col.first.checkbox.onChange(e, row);
                            }
                            else {
                                if (v) {
                                    var newList = [...selected, row];
                                    setSelected(newList);
                                }
                                else {
                                    var newList = selected.filter(s => s[col.first.checkbox.idKey] != row[col.first.checkbox.idKey])
                                    setSelected(newList)
                                }
                            }
                        }}
                    />}
                </Stack>
            )
        }
        // if (col.actionBtn) return <ActionBtn isDense={true} actions={col.ActionBtn} row={row} setOpenCollapse={setOpenCollapse} openCollapse={openCollapse} index={index} objCollapse={objCollapse} setObjCollapse={setObjCollapse} />
        if (col.actionBtn) return <ActionBtn isDense={true} actions={isFunction(col.actionBtn) ? col.actionBtn({ row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse }) : col.actionBtn} row={row} setOpenCollapse={setOpenCollapse} openCollapse={openCollapse} index={index} objCollapse={objCollapse} setObjCollapse={setObjCollapse} />
        if (col.actions) {
            return (
                <ButtonGroup size='small'>
                    {col.actions.map((action, ind) => (
                        <Button
                            key={ind}
                            variant={actionVariant(action)}
                            color="primary"
                            disabled={actionDisabled(action)}
                            onClick={() => action.onClick(row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse)}
                            endIcon={action.icon ? action.icon : null}
                            sx={{ py: 0, fontSize: "85%" }}
                        >
                            {actionLabel(action)}
                        </Button>
                    ))}
                </ButtonGroup>
            )
        }
        return row[col.key];
    }

    return switchRow(col)
}

export default SwitchTypeRow;
