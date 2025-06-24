import React from 'react'

import { FormControl, FormControlLabel, InputLabel, RadioGroup, Radio } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const GenericRadio = ({ name, label, options, disabled, inputs, handleChange }) => {

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
            variant="outlined"
            size='small'
            fullWidth
            disabled={disabled}
            sx={{
                px: 1,
                border: '1px solid ' + theme.palette.grey[300],
                borderRadius: 1,
            }}
        >
            <InputLabel shrink>{label}</InputLabel>
            <RadioGroup
                row
                name={name}
                value={inputs[name]}
                onChange={handleChange}
            >
                {options.map(option => (
                    <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio
                            size='small'
                            sx={{ py: 1 }}
                        />}
                        label={option.label} />
                ))}

            </RadioGroup>
            {/*
                value={inputs[name] || ''}
                onChange={handleChange}
             */}
        </FormControl>
    )
}

// default props
GenericRadio.defaultProps = {
    disabled: false
}

export default GenericRadio;

/*
<ToggleButtonGroup
            color="primary"
            value={inputs[name]}
            disabled={disabled}
            exclusive
            onChange={handleChange}
        >
            {options.map(option => <ToggleButton
                    key={option.value}
                    value={option.value}
                >{option.label}</ToggleButton>)}

        </ToggleButtonGroup>
        */