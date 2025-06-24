import React from 'react';

import { TextField, Stack, CircularProgress, Typography, Popover, Box, IconButton } from '@mui/material';
import { InputOutlined } from '@mui/icons-material';
import CircleIcon from '@mui/icons-material/Circle';

import { isFunction } from '../../../utils/func';


const GlobalInput = ({
    label,
    error,
    disabled,
    placeholder,
    name,
    required,
    readonly,
    type,
    startAdornment,
    popoverContent,
    popoverCB,
    inputProps,
    inputSize,
    warning,
    loading,
    value,
    helperText,
    handleChange,
    handleBlur,
    inputs,
    setInputs,
    validate,
    onBlur,
    ltr,
    addError,
    removeError,
    onChange,
    autoComplete
}) => {

    const [valueState, setValueState] = React.useState("");

    const inputElement = React.useRef(null);

    const [errorS, setErrorS] = React.useState(error);
    const [helperTextS, setHelperTextS] = React.useState(helperText);

    React.useEffect(() => {
        setErrorS(error);
        if (error == true) addError(name);
        else removeError(name);
    }, [name, error]);

    React.useEffect(() => setHelperTextS(helperText), [helperText]);

    // Popover
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const openPopover = (event) => setAnchorEl(inputElement.current);
    const closePopover = () => { setAnchorEl(null) }
    const handleClose = () => setAnchorEl(null);

    const [inputWidth, setInputWidth] = React.useState(0);
    React.useEffect(() => {
        if (inputElement.current) {
            let w = inputElement.current.offsetWidth > 250 ? inputElement.current.offsetWidth : 250;
            setInputWidth(w);
        }
    }, [inputElement]);

    return (
        <>
            <TextField
                autoComplete={autoComplete ? autoComplete : null}
                InputLabelProps={{
                    shrink: true,
                }}
                variant="outlined"
                size={inputSize ? inputSize : (readonly ? "medium" : "small")}
                fullWidth
                label={label}
                placeholder={placeholder}
                error={errorS}
                disabled={disabled | readonly}
                required={required}
                color={errorS ? 'error' : warning ? 'warning' : readonly ? null : 'primary'}
                helperText={<Box sx={{ p: 0 }}>
                    {errorS && <Typography variant='caption' color="warning.main">{helperTextS}</Typography>}
                    {(warning && !errorS) && <Typography variant='caption' color="warning.main">{helperTextS}</Typography>}
                </Box>}
                InputProps={{
                    readOnly: readonly,
                    sx: { bgcolor: errorS ? 'error.lighter' : warning ? 'warning.lighter' : null },
                    startAdornment: (!startAdornment && !popoverContent) ? null : <Stack
                        direction="column"
                        justifyContent="center"
                        alignItems="center"
                        sx={{ height: 1 }}>
                        {popoverContent ?
                            <IconButton
                                disabled={disabled || readonly}
                                size='small' color="primary" aria-label="upload picture" component="label" onClick={openPopover}>
                                {startAdornment ? startAdornment : <CircleIcon sx={{ fontSize: 10 }} />}
                            </IconButton> :
                            startAdornment
                        }
                    </Stack>,
                    endAdornment: loading ? <Stack direction="column" justifyContent="center" alignItems="center" sx={{ height: 1 }}>
                        <CircularProgress size={15} />
                    </Stack> : null
                }}
                inputProps={{ ...inputProps, dir: ltr ? "ltr" : null }}
                inputRef={inputElement}
                type={type}
                name={name}
                value={value ? value : valueState}
                onChange={handleChange ? handleChange : (e) => setValueState(e.target.value)}
                onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }}
                onKeyDown={(e) => { e.key === 'Enter' && e.preventDefault() }}
                onBlur={(e) => {

                    handleBlur(e);

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
                onFocus={e => {
                    e.target.focus();
                    e.target.select();
                }}
            />
            {popoverContent != null && <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ width: inputWidth }}>
                    {isFunction(popoverContent) ? popoverContent({ closePopover }) : popoverContent}
                </Box>
            </Popover>}
        </>
    )

}

GlobalInput.defaultProps = {
    label: "תווית",
    placeholder: "",
    disabled: false,
    name: undefined,
    required: false,
    type: "text",
    startAdornment: null,
    loading: false,
    inputElement: null,
    inputProps: null,
    inputSize: "small",
    value: null,
    helperText: "אזהרה",
    warning: false,
    error: false,
    handleChange: null,
    handleBlur: () => { },
    onBlur: null,
    validate: null,
    ltr: false,
    addError: () => { },
    removeError: () => { },
}

export default GlobalInput;