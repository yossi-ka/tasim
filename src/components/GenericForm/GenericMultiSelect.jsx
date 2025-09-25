import React from 'react';

import { InputLabel, Select, FormControl, MenuItem, OutlinedInput, Tooltip, FormHelperText, Checkbox, ListItemText } from '@mui/material';

const GenericMultiSelect = ({
    name,
    label,
    options,
    required,
    error,
    disabled,
    inputs,
    handleChange,
    tooltip,
    validate,
    onBlur,
    addError,
    removeError
}) => {

    const [valuesChoose, setValueChoose] = React.useState([]);

    React.useEffect(() => {
        let value = inputs[name];
        switch (typeof value) {
            case 'string':
                value = value.split(',');
                break;
            case 'object':
                value = value;
                break;
            default:
                value = [];
                break;
        }
        setValueChoose(value);
    }, [inputs, name]);

    const [errorS, setErrorS] = React.useState(false);

    const [helperText, setHelperText] = React.useState('תוכן לא חוקי');

    React.useEffect(() => {
        setErrorS(error);
        if (error === true) addError(name);
        else removeError(name);
    }, [error, name, setErrorS]);


    const OnChange = (event) => {
        let value = event.target.value;
        setValueChoose(value);
        handleChange(name, value);
    };


    const body =
        <FormControl
            variant="outlined"
            size='small'
            fullWidth
            error={errorS}
            disabled={disabled}
        >
            <InputLabel shrink>{label}</InputLabel>
            <Select
                label={label}
                required={required}
                name={name}
                multiple
                displayEmpty
                value={valuesChoose}
                onChange={OnChange}
                onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }}
                onKeyDown={(e) => { e.key === 'Enter' && e.preventDefault() }}
                disabled={disabled}
                error={errorS}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                    var optionS = options.filter((option) => selected.indexOf(option.value) > -1);
                    return optionS.map((option) => option.label).join(', ');
                }}
                inputProps={{ 'aria-label': 'Without label' }}
                MenuProps={{ sx: { maxHeight: 300 } }}

            >
                {options.map((value) => (
                    <MenuItem key={value.value} value={value.value}>
                        <Checkbox size='small' checked={valuesChoose.indexOf(value.value) > -1} sx={{ '& .MuiSvgIcon-root': { fontSize: 16 } }} />
                        <ListItemText primary={value.label} />
                    </MenuItem>
                ))}
            </Select>
            {errorS && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl >

    return (

        <>
            {tooltip && <Tooltip title={tooltip} arrow>{body}</Tooltip>}
            {!tooltip && body}
        </>
    );
}

GenericMultiSelect.defaultProps = {
    required: false,
    error: false,
    disabled: false,
    validate: null,
    onBlur: null,
    tooltip: null,
    addError: (name) => { return name },
    removeError: (name) => { return name },
}

export default GenericMultiSelect