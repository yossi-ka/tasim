import React from 'react'

import { Checkbox, FormControl, FormControlLabel, FormHelperText } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import { useTheme } from '@mui/material/styles';

const GenericCheckbox = ({
    name,
    label,
    options,
    readonly,
    helperText,
    formReadOnly,
    allFieldsSetting,
    inputs,
    handleChange,
    disabled
}) => {

    const theme = useTheme();

    const checked = () => {
        if (inputs[name]) {
            switch (inputs[name]) {
                case 'true':
                    return true;
                case 'false':
                    return false;
                case '1':
                    return true;
                case '0':
                    return false;
                default:
                    return true;
            }
        }
        return false;
    }

    return (
        <FormControl
            fullWidth
            {...allFieldsSetting}
        >
            <FormControlLabel {...allFieldsSetting}
                control={<Checkbox
                    size='small'
                    {...allFieldsSetting}
                    name={name}
                    checked={checked()}
                    onChange={handleChange}
                    disabled={readonly || formReadOnly || disabled}
                    checkedIcon={<CheckIcon sx={{ color: (readonly || formReadOnly) ? "success.light" : "success.main" }} />}
                    icon={<CloseIcon sx={{ color: (readonly || formReadOnly) ? "error.light" : "error.main" }} />}
                />}
                label={label}
            /> <FormHelperText>{helperText}</FormHelperText>
        </FormControl>
    )
}

GenericCheckbox.defaultProps = {
    options: [],
}

export default GenericCheckbox;