import React from 'react';

import GlobalInput from './GlobalInput';

import { isFunction, isDateNumber, isBetween, formatDateJS, checkDate, formatDate, formatMonth, isValueEmpty } from '../../../utils/func'
// convertDateJsToMonthIL,checkDateMonth
const MonthInput = ({
    label,
    error,
    min,
    max,
    disabled,
    required,
    startAdornment,
    inputElement,
    warning,
    loading,
    helperText,
    name,
    inputs,
    setInputs,
    handleChange,
    handleBlur,
    onBlur,
    validate,
    addError,
    removeError,
    autoComplete
}) => {

    const [valueState, setValueState] = React.useState("");

    const [errorS, setErrorS] = React.useState(false);
    React.useEffect(() => {
        setErrorS(error);
    }, [error]);

    const [helperTextS, setHelperTextS] = React.useState("");
    React.useEffect(() => {
        setHelperTextS(helperText);
    }, [helperText]);

    React.useEffect(() => {
        var inputSelect = inputs[name];
        if (inputSelect && inputSelect !== 0) {
            // setValueState(convertDateJsToMonthIL(inputSelect));
        }
    }, [inputs]);

    return (
        <GlobalInput
            autoComplete={autoComplete}
            ltr={true}
            label={label}
            placeholder="mm/yyyy"
            error={errorS}
            warning={warning}
            helperText={helperTextS}
            disabled={isFunction(disabled) ? disabled({ inputs, setInputs }) : disabled}
            required={required}
            loading={loading}
            startAdornment={startAdornment}
            inputElement={inputElement}
            name={name}
            value={valueState}
            inputs={inputs}
            setInputs={setInputs}
            validate={validate}
            onBlur={onBlur}
            addError={addError}
            removeError={removeError}
            handleChange={(e) => {

                let v = e.target.value;

                // console.log(v);
                if (!isDateNumber(v)) return;

                if (v.charAt(v.length - 1) === "/" && v.charAt(v.length - 2) === "/") return;

                if (v.length < valueState.length) {
                    if (valueState.charAt(valueState.length - 1) === "/") v = v.slice(0, v.length - 1)
                    setValueState(v)
                    return
                };

                if (v.charAt(v.length - 1) === "/") {
                    let arr = v.split("/");
                    let last = arr[0];
                    arr[0] = last.padStart(2, 0);
                    setValueState(arr.join("/"));
                    return;
                };

                if (v.length === 2) v = `${v}/`;

                let arr = v.split("/");
                let len = arr.length;

                if (len === 2 && !isBetween(arr[0], 1, 12)) arr[0] = "12";
                if (len === 2 && arr[1].length > 4) return;


                setValueState(arr.join("/"));

                if (len !== 2 || arr[1].length < 4) return;

                const arrFormatDate = `${arr[0]}/01/${arr[1]}`;
                let date = new Date(arrFormatDate);

                // if (min) {

                //     let minDate = checkDateMonth(min);
                //     //תאריך קטן מהמינימום
                //     if (minDate && date < minDate) {
                //         setErrorS(true);
                //         addError(name);
                //         setHelperTextS("החודש המינימאלי הוא " + formatMonth(minDate))
                //         return;
                //     }
                // }
                // if (max) {

                //     let maxDate = checkDateMonth(max);
                //     //תאריך גדול מהמקסימום
                //     if (maxDate && date > maxDate) {
                //         setErrorS(true);
                //         addError(name);
                //         setHelperTextS("החודש המקסימאלי הוא " + formatMonth(maxDate))
                //         return;
                //     }
                // }

                if (required && isValueEmpty(v)) {
                    setErrorS(true);
                    addError(name);
                    setHelperTextS("שדה חובה");
                    return;
                }

                else if (required && !isValueEmpty(v)) {
                    setErrorS(false);
                    removeError(name);
                    setHelperTextS("");
                }


                if (date !== 'Invalid Date') {
                    setErrorS(false);
                    if (removeError) { removeError(name); }
                    setHelperTextS("");
                    handleChange(name, formatDateJS(new Date(arrFormatDate)));
                }
            }}
        />
    )
}

MonthInput.defaultProps = {
    startAdornment: null
}

export default MonthInput;
