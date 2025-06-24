import React from 'react';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

import GlobalInput from './GlobalInput';

import { convertDateJsToIL, convertDateILtoJS, isFunction, isDateNumber, isBetween, formatDateJS, checkDate, formatDate, isValueEmpty } from '../../../utils/func'
import DatePicker from '../../datePicker';

const DateInput = ({
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
    popoverContent,
    datePicker,
    addError,
    removeError,
    readonly,
    variant,
    color,
    inputSize
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
        if (inputSelect && inputSelect != 0) {
            if (inputSelect.toDate) {
                inputSelect = formatDateJS(inputSelect.toDate());
            }
            setValueState(convertDateJsToIL(inputSelect));
        }
    }, [inputs]);

    const handleDateChange = (e) => {

        let date;
        let arrFormatDate;

        let v;
        if (!e.target) {
            v = convertDateJsToIL(e);
        } else {
            v = e.target.value;
        }

        if (!isDateNumber(v)) return;

        if (v.charAt(v.length - 1) == "/" && v.charAt(v.length - 2) == "/") return;

        if (v.length < valueState.length) {
            if (valueState.charAt(valueState.length - 1) == "/") v = v.slice(0, v.length - 1)
            setValueState(v)
            return
        };

        if (v.charAt(v.length - 1) == "/") {
            let arr = v.split("/");
            let last = arr[arr.length - 2];
            arr[arr.length - 2] = last.padStart(2, 0);
            setValueState(arr.join("/"));
            return;
        };

        if (v.length == 2 || v.length == 5) v = `${v}/`;

        let arr = v.split("/");
        let len = arr.length;

        if (len == 2 && !isBetween(arr[0], 0, 31)) arr[0] = "31";
        if (len == 3 && !isBetween(arr[1], 0, 12)) arr[1] = "12";
        if (len == 3 && arr[2].length > 4) return;

        setValueState(arr.join("/"));

        if (len != 3 || arr[2].length < 4) return;


        if (required && isValueEmpty(v)) {
            setErrorS(true);
            addError(name);
            setHelperTextS("שדה חובה");
            return;
        } else if (required && !isValueEmpty(v)) {
            setErrorS(false);
            removeError(name);
            setHelperTextS("");
        }

        arrFormatDate = `${arr[1]}/${arr[0]}/${arr[2]}`;
        date = new Date(arrFormatDate);
        // } else {

        // }

        if (min) {

            let minDate = checkDate(min);

            //תאריך קטן מהמינימום
            if (minDate && date < minDate) {
                setErrorS(true);
                addError(name);
                setHelperTextS("התאריך המינימלי הוא " + formatDate(minDate));
                return;
            }
        }

        if (max) {

            let maxDate = checkDate(max);

            //תאריך גדול מהמקסימום
            if (maxDate && date > maxDate) {
                setErrorS(true);
                addError(name);
                setHelperTextS("התאריך המקסימלי הוא " + formatDate(maxDate))
                return;
            }
        }

        if (date != 'Invalid Date') {
            setErrorS(false);
            removeError(name);
            setHelperTextS("");
            handleChange(name, formatDateJS(new Date(arrFormatDate)));
        }
    }


    return (
        <GlobalInput
            ltr={true}
            label={label}
            placeholder="dd/mm/yyyy"
            error={errorS}
            warning={warning}
            helperText={helperTextS}
            disabled={isFunction(disabled) ? disabled({ inputs, setInputs }) : disabled}
            required={required}
            loading={loading}
            startAdornment={datePicker ? <CalendarMonthIcon /> : startAdornment}
            popoverContent={datePicker ? ({ closePopover }) => <DatePicker
                endDay={max}
                defaultDate={convertDateILtoJS(valueState)}
                onChange={handleDateChange}
                closePopover={closePopover}
            /> : popoverContent}
            inputElement={inputElement}
            name={name}
            value={valueState}
            inputs={inputs}
            setInputs={setInputs}
            validate={validate}
            onBlur={onBlur}
            addError={addError}
            removeError={removeError}
            handleChange={handleDateChange}

            readonly={readonly}
            variant={variant ? variant : readonly ? "outlined" : "standard"}
            size={inputSize ? inputSize : readonly ? "medium" : "small"}
            color={readonly ? null : color ? color : "primary"}

        // handleChange={(e) => {

        //     let v = e.target.value;

        //     // console.log(v);
        //     if (!isDateNumber(v)) return;

        //     if (v.charAt(v.length - 1) == "/" && v.charAt(v.length - 2) == "/") return;

        //     if (v.length < valueState.length) {
        //         if (valueState.charAt(valueState.length - 1) == "/") v = v.slice(0, v.length - 1)
        //         setValueState(v)
        //         return
        //     };

        //     if (v.charAt(v.length - 1) == "/") {
        //         let arr = v.split("/");
        //         let last = arr[arr.length - 2];
        //         arr[arr.length - 2] = last.padStart(2, 0);
        //         setValueState(arr.join("/"));
        //         return;
        //     };

        //     if (v.length == 2 || v.length == 5) v = `${v}/`;

        //     let arr = v.split("/");
        //     let len = arr.length;

        //     if (len == 2 && !isBetween(arr[0], 0, 31)) arr[0] = "31";
        //     if (len == 3 && !isBetween(arr[1], 0, 12)) arr[1] = "12";
        //     if (len == 3 && arr[2].length > 4) return;


        //     setValueState(arr.join("/"));

        //     if (len != 3 || arr[2].length < 4) return;


        //     const arrFormatDate = `${arr[1]}/${arr[0]}/${arr[2]}`;
        //     let date = new Date(arrFormatDate);

        //     if (min) {

        //         let minDate = checkDate(min);

        //         //תאריך קטן מהמינימום
        //         if (minDate && date < minDate) {
        //             setErrorS(true);
        //             addError(name);
        //             setHelperTextS("התאריך המינימאלי הוא " + formatDate(minDate));
        //             return;
        //         }
        //     }
        //     if (max) {

        //         let maxDate = checkDate(max);

        //         //תאריך גדול מהמקסימום
        //         if (maxDate && date > maxDate) {
        //             setErrorS(true);
        //             addError(name);
        //             setHelperTextS("התאריך המקסימאלי הוא " + formatDate(maxDate))
        //             return;
        //         }
        //     }

        //     if (required && isValueEmpty(v)) {
        //         setErrorS(true);
        //         addError(name);
        //         setHelperTextS("שדה חובה");
        //         return;
        //     } else if (required && !isValueEmpty(v)) {
        //         setErrorS(false);
        //         removeError(name);
        //         setHelperTextS("");
        //     }

        //     if (date != 'Invalid Date') {
        //         setErrorS(false);
        //         removeError(name);
        //         setHelperTextS("");
        //         handleChange(name, formatDateJS(new Date(arrFormatDate)));
        //     }
        // }}
        />
    )
}

DateInput.defaultProps = {
    startAdornment: null,
    removeError: () => { },
}

export default DateInput;
