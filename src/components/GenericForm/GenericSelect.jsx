import React from 'react'

import { FormControl, FormHelperText, Select, InputLabel, MenuItem, Tooltip,Typography } from '@mui/material'

const GenericSelect = ({
    name,
    label,
    bigLabel,
    variant,
    inputSize,
    options,
    required,
    readonly,
    formReadOnly,
    error,
    disabled,
    inputs,
    handleChange,
    onChange,
    tooltip,
    validate,
    onBlur,
    color,
    helperText,
    first = true,
    firstText
}) => {

    const [errorS, setErrorS] = React.useState(false);
    const [helperTextS, setHelperTextS] = React.useState(helperText);
    React.useEffect(() => {
        setErrorS(error);
    }, [error]);
    React.useEffect(() => {
        setHelperTextS(helperText);
    }, [helperText]);

    const body = <FormControl
        variant={variant ? variant : (formReadOnly) ? "outlined" : readonly ? "outlined" : "standard"}
        size={inputSize ? inputSize : (formReadOnly) ? "medium" : readonly ? "medium" : "small"}
        fullWidth
        error={errorS}
        disabled={disabled || readonly || formReadOnly}
        color={(formReadOnly) ? null : readonly ? null : color ? color : "primary"}
        sx={{ bgcolor: (readonly && !formReadOnly) ? "secondary.lighter" : null }}
    // sx={{ bgcolor: "primary.lighter" }}
    >
        <InputLabel required={required} shrink>{!bigLabel ? label : ''}</InputLabel>
        <Select
            label={!bigLabel ? label : ''}
            required={required}
            name={name}
            error={errorS}
            disabled={disabled || readonly || formReadOnly}
            value={inputs[name] || ''}
            onChange={(e) => {
                if (onChange) onChange(e);
                handleChange(e);
            }}
            onBlur={(e) => {

                if (validate) validate({
                    value: e.target.value,
                    inputs,
                    setError: setErrorS,
                    setMessage: setHelperTextS
                })

                if (onBlur) onBlur({
                    value: e.target.value,
                    name: e.target.name,
                    inputs,
                    setError: setErrorS,
                    setMessage: setHelperTextS
                })
            }}
        >
            {first && <MenuItem value="0" sx={{ fontWeight: 600 }} >
                {firstText ? firstText : "בחירת " + label}
            </MenuItem>}
            {options.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
        </Select>
        {(errorS || helperText) && <FormHelperText>{helperTextS}</FormHelperText>}
    </FormControl>

    return (

        <>
            {bigLabel && <Typography variant="h5" color="primary" sx={{ mb: 1 }}>{label}</Typography>}
            {tooltip && <Tooltip title={tooltip} arrow>{body}</Tooltip>}
            {!tooltip && body}
        </>
    )
}

// defaultProps 
GenericSelect.defaultProps = {
    required: false,
    error: false,
    variant: null,
    inputSize: null,
    disabled: false,
    validate: null,
    onBlur: null,
    tooltip: null,
    color: null,
    onChange: null,
    helperText: null,
    first: false,
    firstText: null
}

export default GenericSelect