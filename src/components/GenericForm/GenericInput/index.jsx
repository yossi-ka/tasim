import React from 'react';

import { FormControl, FormHelperText, OutlinedInput, InputLabel, Tooltip, CircularProgress, Stack, TextField, Typography } from '@mui/material';

import { formatDateJS, formatMonthJS, formatDateTime, formatDate } from '../../../utils/func';

const GenericInput = ({
    name,
    label,
    bigLabel,
    type,
    variant,
    inputSize,
    format,
    allFieldsSetting,
    required,
    readonly,
    formReadOnly,
    controlProps,
    inputMuiProps,
    inputProps,
    inputs,
    setInputs,
    handleChange,
    error,
    disabled,
    validate,
    onBlur,
    onFocus,
    onChange,
    tooltip,
    loading,
    color,
    multiline,
    helperText,
    toFixed,
    placeholder,
    warning,
    rows
}) => {

    const [errorS, setErrorS] = React.useState(false);
    const [helperTextS, setHelperTextS] = React.useState('חובה');
    React.useEffect(() => {
        setErrorS(error);
    }, [error]);

    React.useEffect(() => {
        setHelperTextS(helperText);
    }, [helperText]);

    const [typeS, setTypeS] = React.useState(type);
    React.useEffect(() => {

        if (readonly || formReadOnly) {
            setTypeS("text");
            return;
        } else {
            switch (type) {
                case 'currency':
                    setTypeS("number");
                    break;
                case 'currencyIL':
                    setTypeS("number");
                    break;
                case 'percent':
                    setTypeS("number");
                    break;
                case 'phone':
                    setTypeS("tel");
                    break;
                default:
                    setTypeS(type);
            }
        }
    }, [type, readonly, formReadOnly]);

    const value = () => {

        if (inputs && inputs[name] && !(readonly || formReadOnly)) {
            switch (type) {
                case 'currency':
                    return Math.round(inputs[name] * 100) / 100;
                case 'currencyIL':
                    return Math.round(inputs[name] * 100) / 100;
                case 'percent':
                    return Math.round(inputs[name] * 100) / 100;
                case 'date':
                    return formatDateJS(inputs[name]);
                case 'month':
                    return formatMonthJS(inputs[name]);
                default:
                    return inputs[name];
            }
        } else if (inputs && inputs[name] && (readonly || formReadOnly)) {
            switch (type) {
                case 'date':
                    if (inputs[name] == null || inputs[name] == undefined) return '-';
                    return formatDate(inputs[name]);
                case 'month':
                    return formatMonthJS(inputs[name]);
                case 'date-readmore':
                    return formatDateTime(inputs[name]);
                case 'datetime-readmore':
                    return formatDateTime(inputs[name]);
                case 'datetime':
                    return formatDateTime(inputs[name]);
                case 'datetime-local':
                    return formatDateTime(inputs[name]);
                case 'date-local':
                    return formatDateTime(inputs[name]);
                // case 'currency':
                //     return Math.round(inputs[name] * 100) / 100;
                default:
                    return inputs[name];
            }
        } else {
            switch (type) {
                case 'currency':
                    return '0.00';
                case 'currencyIL':
                    return '0.00';
                case 'percent':
                    return '0.00';
                // case 'integer':
                //     return '0';
                default:
                    return '';
            }

        }
        // if (format ){
        //     switch (format) {
        //         case 'currency':
        //             return formatCurrency(inputs[name]);
        //         default:
        //             return inputs[name];
        //     }
        // }
        // if (inputs && inputs[name]) {
        //     switch (type) {
        //         // לא מבין למה זה לא עובד
        //         case 'date':
        //             return formatDateJS(inputs[name]);
        //         case 'month':
        //             return formatMonthJS(inputs[name]);
        //         case 'date-readmore':
        //             return formatDateTime(inputs[name]);
        //         case 'datetime-readmore':
        //             return formatDateTime(inputs[name]);
        //         case 'datetime':
        //             return formatDateTime(inputs[name]);
        //         case 'datetime-local':
        //             return formatDateTime(inputs[name]);
        //         case 'date-local':
        //             return formatDateTime(inputs[name]);
        //         default:
        //             return inputs[name];
        //     }
        // } 
    }

    const chackDisabled = () => {
        if (typeof disabled === 'function') {
            if (disabled({ inputs, setInputs })) {
                return true;
            } else {
                return false;
            }
        } else {
            return disabled;
        }
    }

    const isStartAdornment = React.useMemo(() => {
        return type == 'currencyIL' || type == 'percent';
    }, [type]);

    const floatNumberInputProps = React.useMemo(() => {
        if (type == 'currencyIL' || type == 'percent') {
            return {
                inputMode: 'decimal',
                pattern: '[0-9]*',
                step: '0.01',
            }
        } else {
            return {};
        }
    }, [type]);

    const textField = <TextField
        error={errorS}
        disabled={chackDisabled() || formReadOnly || readonly}
        variant={variant ? variant : (formReadOnly) ? "outlined" : readonly ? "outlined" : "standard"}
        size={inputSize ? inputSize : (formReadOnly) ? "medium" : readonly ? "medium" : "small"}
        color={(formReadOnly) ? null : readonly ? null : color ? color : "primary"}
        label={!bigLabel ? label : ""}
        InputLabelProps={{
            shrink: true,
        }}
        fullWidth
        sx={{ maxWidth: "100%" }}
        type={typeS}
        name={name}
        required={required}
        multiline={multiline}
        rows={rows ? rows : multiline ? 4 : 1}
        {...allFieldsSetting}
        // inputProps={{ ...floatNumberInputProps, ...inputProps }}
        inputProps={{ ...inputProps }}
        InputProps={{
            sx: { bgcolor: (readonly && !formReadOnly) ? "secondary.lighter" : null },
            startAdornment: !isStartAdornment ? null : <Stack direction="column" justifyContent="center" alignItems="center" sx={{ height: 1 }}>
                {type == 'currencyIL' && <span>₪</span>}
                {type == 'percent' && <span>%</span>}
            </Stack>,
            endAdornment: loading ? <Stack direction="column" justifyContent="center" alignItems="center" sx={{ height: 1 }}>
                <CircularProgress size={15} />
            </Stack> : null
        }}
        value={value() || ''}
        placeholder={placeholder ? placeholder : ""}
        // value={inputs[name] || ''}
        onChange={(e) => {
            if (onChange) onChange(e);
            handleChange(e)
        }}
        // onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }}
        // onKeyDown={(e) => { e.key === 'Enter' && e.preventDefault() }}
        onFocus={(e) => {

            e.target.select();

            if (onFocus) onFocus({
                value: e.target.value,
                inputs,
                setInputs,
                setError: setErrorS,
                setMessage: setHelperTextS
            })
        }}
        onBlur={(e) => {

            if (type == 'currencyIL' || type == 'currency' || type == 'percent') {
                setInputs({ ...inputs, [name]: parseFloat(e.target.value).toFixed(toFixed) });
            }

            if (validate) validate({
                value: e.target.value,
                inputs,
                setInputs,
                setError: setErrorS,
                setMessage: setHelperTextS
            })

            if (onBlur) onBlur({
                value: e.target.value,
                inputs,
                setInputs,
                setError: setErrorS,
                setMessage: setHelperTextS
            })
        }}
        helperText={errorS && helperTextS ? helperTextS : ''}
    />

    const body = <FormControl
        error={errorS}
        disabled={disabled || formReadOnly || readonly}
        variant="outlined"
        required={required}
        fullWidth
        sx={{ maxWidth: "100%", bgcolor: (readonly || formReadOnly) ? "secondary.lighter" : null }}
        {...controlProps}
    >
        <InputLabel required={required} shrink>
            {label}
        </InputLabel>
        <OutlinedInput
            error={errorS}
            disabled={disabled || formReadOnly || readonly}
            type={typeS}
            // type={type}
            size="small"
            name={name}
            required={required}
            {...inputMuiProps}
            {...allFieldsSetting}
            readOnly={readonly}
            inputProps={inputProps}
            value={value() || ''}
            // value={inputs[name] || ''}
            onChange={handleChange}
            onBlur={(e) => {

                if (validate) validate({
                    value: e.target.value,
                    inputs,
                    setError: setErrorS,
                    setMessage: setHelperTextS
                })

                if (onBlur) onBlur({
                    value: e.target.value,
                    inputs,
                    setInputs,
                    setError: setErrorS,
                    setMessage: setHelperTextS
                })
            }}
        />
        {errorS && <FormHelperText sx={{ fontSize: "80%", m: 0, p: 0 }}>{helperTextS}</FormHelperText>}
    </FormControl>

    // return (
    //     <>
    //         {tooltip && <Tooltip title={tooltip} arrow>{body}</Tooltip>}
    //         {!tooltip && body}
    //     </>
    // )
    return (
        <>
            {bigLabel && <Typography variant="h5" color="primary" sx={{ mb: 1 }}>{label}</Typography>}
            {tooltip && <Tooltip title={tooltip} arrow>{textField}</Tooltip>}
            {!tooltip && textField}
        </>
    )
}

GenericInput.defaultProps = {
    type: 'text',
    format: null,
    variant: null,
    inputSize: null,
    controlProps: {},
    inputMuiProps: {},
    inputProps: {},
    required: false,
    disabled: false,
    error: false,
    validate: null,
    onBlur: null,
    onFocus: null,
    onChange: null,
    tooltip: null,
    loading: false,
    multiline: false,
    color: null,
    toFixed: 2,
    bigLabel: false,
    placeholder: null,
    rows: null
}

export default GenericInput;
