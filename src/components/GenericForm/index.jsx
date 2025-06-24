import React from 'react';

import { Box, Button, Divider, Grid, Typography, Accordion, AccordionSummary, AccordionDetails, ButtonGroup, IconButton, Tooltip, Collapse, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DialpadIcon from '@mui/icons-material/Dialpad';

import { useTheme } from '@mui/material/styles';

import GenericInput from './GenericInput';
import GenericSelect from './GenericSelect';
import GenericCheckbox from './GenericCheckbox';
import GenericRadio from './GenericRadio';
import NumberInput from './GenericInput/NumberInput';
import DateInput from './GenericInput/DateInput';
import MonthInput from './GenericInput/MonthInput';
import LineCollapse from './LineCollapse';
import GenericMultiSelect from './GenericMultiSelect';
import Context from '../../context';

import { isPhone } from '../../utils/func';
import GenericAutocomplete from './GenericAutocomplete';
import GlobalInput from './GenericInput/GlobalInput';


const GenericForm = ({ fields, onSubmit, initInputs, setInitInput, onChange, border, allFieldsSetting, readonly, isForm, isEnterPress }) => {

    const theme = useTheme();

    const { getLookup } = React.useContext(Context);

    const [errors, setErrors] = React.useState({});

    const addError = (name) => {
        if (!name) return;
        setErrors({ ...errors, [name]: true });
    }
    const removeError = (name) => {
        if (!errors[name]) return;
        let newErrors = { ...errors };
        delete newErrors[name];
        setErrors(newErrors);
    }

    const [readonlyState, setReadonlyState] = React.useState(readonly);
    React.useEffect(() => {
        setReadonlyState(readonly);
    }, [readonly]);

    const [inputs, setInputs] = React.useState({});
    React.useEffect(() => {
        if (initInputs) {
            let newInput = initInputs;
            let dateFields = fields.filter(f => f.type == "date");
            // console.log(fields);
            setInputs(initInputs);
        } else {
            setInputs({});
        }
    }, [initInputs]);

    // console.log(inputs);

    const handleChange = (e) => {
        if (readonly) return;

        if (e.target.type === "checkbox") {
            if (setInitInput) setInitInput({ ...inputs, [e.target.name]: e.target.checked })
            setInputs({ ...inputs, [e.target.name]: e.target.checked ? 1 : 0 });
            return;
        }

        let value = e.target.value;


        if (e.target.type === "number") value = Number(value);
        if (e.target.type === "month") value = new Date(value + "-01");
        if (e.target.type === "date") value = new Date(value);

        if (e.target.type === "tel" && !isPhone(value)) return;

        if (onChange) onChange(e);
        if (setInitInput) {
            setInitInput({ ...inputs, [e.target.name]: value })
        }
        setInputs({ ...inputs, [e.target.name]: value });
    }

    const handleChangeSimple = (name, value) => {

        if (readonly) return;

        let newInputs = { ...inputs, [name]: value };

        if (setInitInput) {
            setInitInput(newInputs)
        }

        setInputs(newInputs);

    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(inputs);
    }

    const fixColSize = (field) => {
        let size = field.size ? field.size : 12;
        if (isObject(size)) {
            return size;
        } else {
            return { xs: size };
        }
    }

    const switchField = (field) => {
        // if( field.type == 'line')
        if (field.displayCondition && !field.displayCondition(inputs)) return null;
        if (field.cb) return field.cb(inputs, setInputs);
        switch (field.type) {
            case 'empty':
                return <Box />;
            case 'title':
                return <Typography variant="h5" color="primary">{field.label}</Typography>;
            case 'lineCollapse':
                return <LineCollapse field={field} fixColSize={fixColSize} switchField={switchField} readonlyState={readonlyState} allFieldsSetting={allFieldsSetting} />;
            case 'line':
                return <>
                    <Divider sx={{ mt: !field.mt ? 3 : field.mt }} />
                    {field.label && <Typography
                        variant='subtitle2'
                        color="primary"
                    >
                        {field.label}
                    </Typography>}
                </>;
            case 'textTitle':
                return <Stack alignContent='center' style={{ position: 'relative', top: '-10px' }}>
                    <Typography variant="body2" >{field.label}</Typography>
                    <Typography variant="h4" color={field.color}>{field.value}</Typography>
                </Stack>
            case 'group':
                return (
                    <>
                        {field.title && <Typography variant='subtitle2' color="primary" gutterBottom>{field.title}</Typography>}
                        <Box sx={{
                            width: 1,
                            border: field.border ? `1px solid ${theme.palette.grey[200]}` : 'none',
                            borderRadius: '4px',
                            p: field.border ? 2 : 0,
                        }}>
                            <Grid container spacing={2}>
                                {field.fields.map((fieldG, indexG) => {
                                    if (fieldG.displayConditionGrid && !fieldG.displayConditionGrid(inputs)) return null;
                                    fieldG = { ...fieldG, allFieldsSetting: allFieldsSetting, formReadOnly: readonlyState };
                                    return (
                                        <Grid item {...fixColSize(fieldG)} key={indexG}>
                                            {switchField(fieldG)}
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </Box>
                    </>
                )
            case 'accordion':
                return (
                    <>
                        {field.tabs.map((tab, index) => {
                            return (
                                <Accordion>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls={`panel${index}a-content`}
                                        id={`panel${index}a-header`}
                                    >
                                        <Typography>{tab.title}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2}>
                                            {tab.fields.map((fieldT, indexT) => {
                                                fieldT = { ...fieldT, allFieldsSetting: allFieldsSetting, formReadOnly: readonlyState };
                                                return (
                                                    <Grid item {...fixColSize(fieldT)} key={indexT}>
                                                        {switchField(fieldT)}
                                                    </Grid>
                                                )
                                            })}
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            )
                        })}
                    </>
                )
            case 'select':
                return <GenericSelect {...field} inputs={inputs} handleChange={handleChange} />;
            case 'selectMulti':
                return <GenericMultiSelect {...field} inputs={inputs} handleChange={handleChangeSimple} />;
            case 'radio':
                return <GenericRadio {...field} inputs={inputs} handleChange={handleChange} />;
            case 'lookup':
                if (field.parentID) {
                    if (inputs[field.parentID] == 0 || inputs[field.parentID] == null) {
                        field.options = [];
                    } else {
                        field.options = getLookup(field.lookup, field.parentID ? inputs[field.parentID] : null);
                    }
                } else {
                    field.options = getLookup(field.lookup, null);
                }
                return field.options.length < 10 ? <GenericSelect {...field} inputs={inputs} handleChange={handleChange} />
                    : <GenericAutocomplete {...field} inputs={inputs} handleChange={handleChange} />;
            case 'lookupMulti':
                if (field.parentID) {
                    if (inputs[field.parentID] == 0 || inputs[field.parentID] == null) {
                        field.options = [];
                    } else {
                        field.options = getLookup(field.lookup, field.parentID ? inputs[field.parentID] : null);
                    }
                } else {
                    field.options = getLookup(field.lookup, null);
                }
                return <GenericMultiSelect {...field} inputs={inputs} handleChange={handleChangeSimple} />;

            case 'lookup-autocomplete':
                if (field.parentID) {
                    if (inputs[field.parentID] == 0 || inputs[field.parentID] == null) {
                        field.options = [];
                    } else {
                        field.options = getLookup(field.lookup, field.parentID ? inputs[field.parentID] : null);
                    }
                } else {
                    field.options = getLookup(field.lookup, null);
                }
                return <GenericAutocomplete {...field} inputs={inputs} handleChange={handleChange} />;
            case 'checkbox':
                return <GenericCheckbox {...field} inputs={inputs} handleChange={handleChange} />;
            case 'checkboxGroup':
                return (
                    <>
                        {field.fields.map((fieldG, indexG) => {
                            fieldG = { ...fieldG, allFieldsSetting: allFieldsSetting, formReadOnly: readonlyState };
                            return <GenericCheckbox key={indexG} {...fieldG} inputs={inputs} handleChange={handleChange} />;
                        })}
                    </>
                )
            case 'submit':
                return <Button
                    size={field.inputSize ? field.inputSize : "medium"}
                    startIcon={field.icon}
                    disabled={field.disabled}
                    fullWidth
                    variant={field.variant ? field.variant : "text"}
                    color={field.color ? field.color : "primary"}
                    type='submit'>
                    {field.label || 'שליחת טופס'}
                </Button>;
            case 'reset':
                return <Button size={field.inputSize ? field.inputSize : "medium"} fullWidth variant={field.variant ? field.variant : "text"} type='reset'>{field.label || 'ניקוי טופס'}</Button>;
            case 'button':
                return <Button
                    size={field.inputSize ? field.inputSize : "medium"}
                    startIcon={field.icon}
                    disabled={field.disabled}
                    fullWidth type='button'
                    variant={field.variant ? field.variant : "text"}
                    color={field.color ? field.color : "primary"}
                    onClick={(e) => {
                        e.preventDefault();
                        if (!field.onClick) return;
                        field.onClick(inputs, setInputs);
                    }}
                >{field.label || 'כפתור'}</Button>;
            case 'buttonIconGroup':
                return <ButtonGroup variant={field.variant ? field.variant : "outlined"} sx={{ height: 1 }}>
                    {field.buttons.map((button, index) => {
                        return <Box key={index} sx={{ height: 1 }}>
                            {!button.disabled && <Tooltip arrow title={button.tooltip ? button.tooltip : "לחצן"}>
                                <IconButton
                                    onClick={button.type !== 'submit'
                                        ? (e) => {
                                            e.preventDefault();
                                            if (!button.onClick) return;
                                            button.onClick(inputs, setInputs);
                                        }
                                        : null}
                                    type={button.type}
                                    disabled={button.disabled}
                                    color={button.color ? button.color : 'primary'}
                                >
                                    {button.icon}
                                </IconButton>
                            </Tooltip>}
                            {button.disabled && <IconButton
                                disabled={button.disabled}
                            >
                                {button.icon}
                            </IconButton>}
                        </Box>
                    })}
                </ButtonGroup>;
            case 'integer':
                return <NumberInput
                    {...field}
                    inputs={inputs}
                    handleChange={handleChangeSimple}
                    setInputs={setInputs}
                    isFloat={false}
                />
            case 'number':
                return <NumberInput
                    {...field}
                    inputs={inputs}
                    handleChange={handleChangeSimple}
                    setInputs={setInputs}
                    isFloat={false}
                />
            // case 'text':
            //     return <GlobalInput
            //         {...field}
            //         inputs={inputs}
            //         handleChange={handleChangeSimple}
            //         setInputs={setInputs}
            //         isFloat={false}
            //     />
            
            case 'float':
                return <NumberInput
                    {...field}
                    inputs={inputs}
                    handleChange={handleChangeSimple}
                    setInputs={setInputs}
                    isFloat={true}
                />
            case 'percent':
                return <NumberInput
                    {...field}
                    inputs={inputs}
                    handleChange={handleChangeSimple}
                    setInputs={setInputs}
                    isFloat={true}
                    startAdornment={<span>%</span>}
                    min={0}
                    max={100}
                />
            case 'texterea':
                return <GenericInput {...field} multiline inputs={inputs} handleChange={handleChange} />;
            case 'currencyIL':
                return <NumberInput
                    {...field}
                    inputs={inputs}
                    handleChange={handleChangeSimple}
                    setInputs={setInputs}
                    isFloat={true}
                    startAdornment={<span>₪</span>}
                />
            case 'currency':
                return <NumberInput
                    {...field}
                    inputs={inputs}
                    handleChange={handleChangeSimple}
                    setInputs={setInputs}
                    isFloat={true}
                />
            case 'date':
                return <DateInput
                    {...field}
                    inputs={inputs}
                    handleChange={handleChangeSimple}
                    setInputs={setInputs}
                    startAdornment={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                    datePicker={true}
                    addError={addError}
                    removeError={removeError}
                />
            case 'month':
                return <MonthInput
                    {...field}
                    inputs={inputs}
                    handleChange={handleChangeSimple}
                    setInputs={setInputs}
                    startAdornment={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                    datePicker={true}
                    addError={addError}
                    removeError={removeError}
                />
            default:
                return <GenericInput {...field} type={field.type} inputs={inputs} handleChange={handleChange} setInputs={setInputs} />;
        }
    }

    return (
        <Box
            component={isForm ? 'form' : 'div'}
            onSubmit={handleSubmit} sx={{
                border: border ? '3px solid #E6F7FF' : 'none',
                borderRadius: '4px',
                p: border ? '1rem' : '0'
            }}
            onKeyPress={(e) => {
                if (e.key === 'Enter') {
                    //ביטלתי את זה בגלל שלא ירד שורה באינפוטים של טקסט
                    // e.preventDefault();
                    if (!isEnterPress) return;
                    onSubmit(inputs);
                }
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    // e.preventDefault();
                    if (!isEnterPress) return;
                    onSubmit(inputs);
                }
            }}
        >
            <Grid container spacing={2}>
                {fields.map((field, index) => {
                    if (field.displayConditionGrid && !field.displayConditionGrid(inputs)) return null;
                    field = { ...field, allFieldsSetting: allFieldsSetting, formReadOnly: readonlyState };
                    return (
                        <Grid item {...fixColSize(field)} key={index}>
                            {switchField(field)}
                        </Grid>
                    )
                })}
            </Grid>
        </Box>
    )
}

GenericForm.defaultProps = {
    initInputs: {},
    allFieldsSetting: {},
    border: false,
    required: false,
    readonly: false,
    isForm: true,
    onSubmit: (inputs) => { console.log("submit", inputs); },
    setInitInput: null,
    onChange: null,
    isEnterPress: false
}

export default GenericForm;

function isObject(obj) {
    return obj === Object(obj);
}
