import React, { useEffect } from 'react';

import GlobalInput from './GlobalInput';

import { isNumber, isInteger, formatCurrency, isFunction, isBetween, isValueEmpty } from '../../../utils/func'
const NumberInput = ({
    isFloat,
    toFixed,
    min,
    max,
    label,
    error,
    disabled,
    required,
    startAdornment,
    popoverContent,
    inputElement,
    inputSize,
    warning,
    loading,
    helperText,
    name,
    inputs,
    setInputs,
    handleChange,
    handleBlur,
    onBlur,
    onChange,
    validate,
    addError,
    removeError,
    readonly,
    variant,
    color
}) => {

    const [valueState, setValueState] = React.useState(isFloat ? "0.00" : "0");

    const [errorS, setErrorS] = React.useState(false);
    React.useEffect(() => {
        setErrorS(error);
    }, [error]);

    const [helperTextS, setHelperTextS] = React.useState("");
    React.useEffect(() => {
        setHelperTextS(helperText);
    }, [helperText]);

    React.useEffect(() => {
        setValueState(inputs[name] || (isFloat ? "0.00" : "0"));
    }, [inputs, name]);

    return (
        <GlobalInput
            ltr={true}
            label={label}
            error={errorS}
            warning={warning}
            helperText={helperTextS}
            disabled={(isFunction(disabled) ? disabled({ inputs, setInputs }) : disabled) | readonly}
            required={required}
            loading={loading}
            startAdornment={startAdornment}
            popoverContent={popoverContent}
            inputElement={inputElement}
            inputSize={inputSize}
            name={name}
            value={valueState}
            inputs={inputs}
            setInputs={setInputs}
            validate={validate}
            onBlur={onBlur}
            onChange={onChange}
            addError={addError}
            removeError={removeError}

            readonly={readonly}
            variant={variant ? variant : readonly ? "outlined" : "standard"}
            size={inputSize ? inputSize : readonly ? "medium" : "small"}
            color={readonly ? null : color ? color : "primary"}

            handleChange={(e) => {
                let v = e.target.value;

                if (!isFloat && !isInteger(v)) return;
                if (isFloat && !isNumber(v)) return;

                setValueState(v);
                // if (v === "0" || v === "") return
                if (v.charAt(v.length - 1) === "." || v.slice(-2) === ".0" || v === "-") return;

                if (v === "") v = 0;

                v = isFloat ? Number(parseFloat(v).toFixed(toFixed)) : Number(v);

                if (min && v < min) {
                    setErrorS(true);
                    // addError(name);
                    setHelperTextS("הערך המינימאלי הוא " + min);
                    return;
                };
                if (max && v > max) {
                    setErrorS(true);
                    // addError(name);
                    setHelperTextS("הערך המקסימאלי הוא " + max)
                    return;
                };

                if (required && isValueEmpty(v)) {
                    setErrorS(true);
                    // addError(name);
                    setHelperTextS("שדה חובה");
                    return;
                }

                else if (required && !isValueEmpty(v)) {
                    setErrorS(false);
                    // removeError(name);
                    setHelperTextS("");
                }

                if (onChange) onChange(v);

                setErrorS(false);
                // removeError(name);
                setHelperTextS("");
                handleChange(name, v);
            }}
            handleBlur={(e) => {
                let v = valueState;

                if (v === "") v = "0";

                if (isFloat) v = parseFloat(v).toFixed(toFixed);

                setValueState(v);

            }}
        />
    )
}

NumberInput.defaultProps = {
    isFloat: false,
    toFixed: 2,
    min: null,
    max: null,
    popoverContent: null,
    popoverCB: null,
    onChange: null,
}

export default NumberInput;
