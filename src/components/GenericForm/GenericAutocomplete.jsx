import React from "react";


import { Autocomplete, FormControl, FormHelperText, TextField, createFilterOptions } from "@mui/material";
import { isEmpty } from "../../utils/func";
// import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';

const filter = createFilterOptions();

const GenericAutocomplete = ({
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
    const autocompleteValue = React.useMemo(() => {
        if (!inputs[name]) return null;
        const option = options.find(o => o.value === inputs[name]);
        return option;
    }, [inputs[name], options])


    return <FormControl fullWidth> <Autocomplete

        onChange={(e, v) => {
            const event = {
                target: {
                    name: name,
                    value: v.value ? v.value : '',
                    type: 'autocomplete'
                }
            }
            if (onChange) onChange(event);
            handleChange(event);
        }
        }
        fullWidth
        size="small"
        // size={inputSize ? inputSize : (formReadOnly) ? "medium" : readonly ? "medium" : "small"}
        value={autocompleteValue}
        name={name}
        required={required}
        disabled={disabled || readonly || formReadOnly}
        disableClearable
        disablePortal
        options={options}
        renderInput={(params) => <TextField name={name}
            error={!isEmpty(inputs[name]) && isNaN(inputs[name])}
            fullWidth
            required={required}
            size="small"
            // size={inputSize ? inputSize : (formReadOnly) ? "medium" : readonly ? "medium" : "small"}
            variant={variant ? variant : (formReadOnly) ? "outlined" : readonly ? "outlined" : "standard"}
            {...params}
            label={label}
        />}
    />

        {(isNaN(inputs[name])) && <FormHelperText>{inputs[name]}</FormHelperText>}
    </FormControl>
}
export default GenericAutocomplete;