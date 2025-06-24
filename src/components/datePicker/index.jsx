import React from 'react'

import { Box, Button, ButtonGroup, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import GenericForm from '../GenericForm';
import { formatDateJS, getDateTimeFromNow } from '../../utils/func';
import DateInput from '../GenericForm/GenericInput/DateInput';

const DatePicker = ({ startDay, endDay, defaultDate, onChange, closePopover }) => {

    const [date, setDate] = React.useState({});

    React.useEffect(() => {
        if (!defaultDate) {
            if (new Date() > new Date(endDay)) {
                setDate({
                    year: new Date(endDay).getFullYear(),
                    month: ("" + new Date(endDay).getMonth()).padStart(2, "0"),
                    day: new Date(endDay).getDate()
                })
            } else {
                setDate({
                    year: new Date().getFullYear(),
                    month: ("" + new Date().getMonth()).padStart(2, "0"),
                    day: new Date().getDate()
                })
            }
        }
        if (defaultDate && new Date(defaultDate) >= new Date(startDay) && new Date(defaultDate) <= new Date(endDay)) {
            setDate({
                year: new Date(defaultDate).getFullYear(),
                month: ("" + new Date(defaultDate).getMonth()).padStart(2, "0"),
                day: new Date(defaultDate).getDate()
            })
        }
    }, [defaultDate])

    const months = [
        { value: '00', labelHe: "ינואר", labelEn: "January" },
        { value: "01", labelHe: "פברואר", labelEn: "February" },
        { value: "02", labelHe: "מרץ", labelEn: "March" },
        { value: "03", labelHe: "אפריל", labelEn: "April" },
        { value: "04", labelHe: "מאי", labelEn: "May" },
        { value: "05", labelHe: "יוני", labelEn: "June" },
        { value: "06", labelHe: "יולי", labelEn: "July" },
        { value: "07", labelHe: "אוגוסט", labelEn: "August" },
        { value: "08", labelHe: "ספטמבר", labelEn: "September" },
        { value: "09", labelHe: "אוקטובר", labelEn: "October" },
        { value: "10", labelHe: "נובמבר", labelEn: "November" },
        { value: "11", labelHe: "דצמבר", labelEn: "December" },
    ];
    const days = [...Array(31).keys()].map(d => d + 1);
    const daysOfWeek = [
        { value: "0", labelHe: "ראשון", labelEn: "Sun" },
        { value: "1", labelHe: "שני", labelEn: "Mon" },
        { value: "2", labelHe: "שלישי", labelEn: "Tue" },
        { value: "3", labelHe: "רביעי", labelEn: "Wed" },
        { value: "4", labelHe: "חמישי", labelEn: "Thu" },
        { value: "5", labelHe: "שישי", labelEn: "Fri" },
        { value: "6", labelHe: "שבת", labelEn: "Sat" },
    ];





    const years = React.useMemo(() => {
        const startY = new Date(startDay).getFullYear();
        const endY = new Date(endDay).getFullYear();
        return [...Array(endY - startY + 1).keys()].map(y => y + startY);
    }, [startDay, endDay])


    const correctMonths = React.useMemo(() => {
        if (date.year) {
            if (date.year === new Date(startDay).getFullYear()) {
                return months.filter(m => m.value >= new Date(startDay).getMonth())
            } else if (date.year === new Date(endDay).getFullYear()) {
                return months.filter(m => m.value <= new Date(endDay).getMonth())
            } else {
                return months
            }
        }
    }, [date.year])

    const correctDays = React.useMemo(() => {
        if (date.year && date.month) {
            return days.filter(d => new Date(date.year, date.month, d).getMonth() === (Number(date.month)))
        }
        else {
            return []
        }
    }, [date.year, date.month])


    React.useEffect(() => {
        onChange && onChange(formatDateJS(new Date(date.year, date.month, date.day)));
    }, [date])


    const checkDisabled = (y, m, d) => {
        const date = new Date(y, m, d);
        if (date < new Date(startDay) || date > new Date(endDay)) return true;
        return false;
    }

    if (!date.year || !date.month || !date.day) return <></>;

    return (
        <Stack direction='column' sx={{ p: 1 }}>
            <GenericForm
                fields={[
                    {
                        name: 'year',
                        label: 'שנה',
                        type: 'select',
                        options: years.map(y => { return { label: y, value: y } }), size: 6
                    },
                    {
                        name: 'month',
                        label: 'חודש',
                        type: 'select',
                        options: correctMonths.map(m => { return { label: m.labelHe, value: m.value } }), size: 6
                    },
                ]}
                initInputs={date}
                setInitInput={setDate}
            />
            <Grid container rowSpacing={1}>
                <Grid item xs={12}>
                    <Stack direction="row" spacing={1} justifyContent="space-between">
                        <IconButton
                            onClick={() => {
                                let newDate = new Date(date.year, (Number(date.month) - 1), date.day);
                                if (newDate.getMonth() != new Date(date.year, (Number(date.month) - 1)).getMonth()) {
                                    // console.log(newDate.getMonth != new Date(date.year, (Number(date.month) - 1)).getMonth())
                                    // console.log("n", newDate.getMonth(), "o", new Date(date.year, (Number(date.month) - 1)).getMonth())
                                    newDate = new Date(date.year, date.month, 0);
                                }
                                if (newDate < new Date(startDay)) return setDate({
                                    year: new Date(startDay).getFullYear(),
                                    month: ("" + new Date(startDay).getMonth()).padStart(2, "0"),
                                    day: new Date(startDay).getDate() + 1
                                });
                                setDate({
                                    ...date,
                                    day: newDate.getDate(),
                                    month: newDate.getMonth().toString().padStart(2, "0"),
                                    year: newDate.getFullYear()
                                })
                            }}
                        ><ArrowForwardIosIcon /></IconButton>
                        <Button
                            onClick={() => {
                                closePopover();
                                setDate({
                                    year: new Date().getFullYear(),
                                    month: ("" + new Date().getMonth()).padStart(2, "0"),
                                    day: new Date().getDate()
                                })
                            }}
                        >היום</Button>
                        <IconButton
                            onClick={() => {
                                let newDate = new Date(date.year, (Number(date.month) + 1), date.day);
                                if (newDate.getMonth() != new Date(date.year, (Number(date.month) + 1)).getMonth()) {
                                    newDate = new Date(date.year, (Number(date.month) + 1), 1);
                                }
                                if (newDate > new Date(endDay)) return setDate({
                                    year: new Date(endDay).getFullYear(),
                                    month: ("" + new Date(endDay).getMonth()).padStart(2, "0"),
                                    day: new Date(endDay).getDate()
                                });
                                setDate({
                                    ...date,
                                    day: newDate.getDate(),
                                    month: newDate.getMonth().toString().padStart(2, "0"),
                                    year: newDate.getFullYear()
                                })
                            }}
                        ><ArrowBackIosIcon /></IconButton>
                    </Stack>
                </Grid>
                {daysOfWeek.map(d => <Grid item xs={1.7} key={d.value}>
                    <Typography fontSize={10} key={d.value} variant="subtitle2" align='center' >{d.labelHe}</Typography>
                </Grid>)}

                {[...Array(new Date(date.year, date.month).getDay()).keys()].map(day => <Grid key={day} item xs={1.7}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                            disabled={checkDisabled(date.year, ("" + new Date(date.year, date.month, -(new Date(date.year, date.month).getDay() - day) + 1).getMonth()).padStart(2, "0"), new Date(date.year, date.month, -(new Date(date.year, date.month).getDay() - day) + 1).getDate(), true)}
                            onClick={() => setDate({
                                ...date,
                                day: new Date(date.year, date.month, -(new Date(date.year, date.month).getDay() - day) + 1).getDate(),
                                month: ("" + new Date(date.year, date.month, -(new Date(date.year, date.month).getDay() - day) + 1).getMonth()).padStart(2, "0")
                            })}
                            key={day}
                            size="small"
                            color='secondary'
                            sx={{ m: 0, p: 0 }}
                        >
                            {new Date(date.year, date.month, -(new Date(date.year, date.month).getDay() - day) + 1).getDate()}
                        </IconButton>
                    </Stack>
                </Grid>)}


                {correctDays.map(day => <Grid item xs={1.7}
                    key={day}
                    onClick={() => {
                        closePopover();
                        setDate({ ...date, day: day })
                    }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                            disabled={checkDisabled(date.year, date.month, day)}
                            key={day}
                            size="small"
                            variant={date.day == day ? 'contained' : "text"}
                            sx={{ m: 0, p: 0, bgcolor: date.day == day ? 'primary.main' : 'transparent', color: date.day == day ? 'primary.contrastText' : 'primary.main' }}
                            color="primary"
                        >
                            {day}
                        </IconButton>
                    </Stack>
                </Grid>)}

                {[...Array(6 - new Date(date.year, date.month, correctDays[correctDays.length - 1]).getDay()).keys()].map(day => <Grid key={day} item xs={1.7}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                            disabled={checkDisabled(date.year, date.month, correctDays[correctDays.length - 1] + day + 1)}
                            onClick={() => setDate({
                                ...date,
                                day: new Date(date.year, date.month, correctDays[correctDays.length - 1] + day + 1).getDate(),
                                month: ("" + new Date(date.year, date.month, correctDays[correctDays.length - 1] + day + 1).getMonth()).padStart(2, "0")
                            })}
                            key={day}
                            color='secondary'
                            size="small"
                            sx={{ m: 0, p: 0 }}
                        >
                            {new Date(date.year, date.month, correctDays[correctDays.length - 1] + day + 1).getDate()}
                        </IconButton>
                    </Stack>
                </Grid>)}

            </Grid>

        </Stack>
    )
}
DatePicker.defaultProps = {
    startDay: formatDateJS(getDateTimeFromNow({ year: -100 })),
    endDay: formatDateJS(getDateTimeFromNow({ year: 10 })),//formatDateJS(getDateTimeFromNow({ year: 30 })),
    defaultDate: formatDateJS()
}
export default DatePicker

/*
{
            <>
                <TextField
                    dir='ltr'
                    disabled
                    value={date.year && date.month && date.day ? `${date.day}/${date.month}/${date.year}` : ""}
                ></TextField>
                <Typography variant="subtitle1" component="h2" gutterBottom>
                    years
                </Typography>
                <ButtonGroup>
                    {years.map((year) => (
                        <Button
                            key={year}
                            onClick={() => setDate({ ...date, year: year })}
                            variant={date.year == year ? 'contained' : "outlined"}
                        >{year}</Button>))}
                </ButtonGroup>
                <Typography variant="subtitle1" component="h2" gutterBottom>
                    months
                </Typography>
                {date.year && <ButtonGroup>
                    {correctMonths.map((month) => (
                        <Button
                            key={month.value}
                            onClick={() => setDate({ ...date, month: month.value })}
                            variant={date.month == month.value ? 'contained' : "outlined"}
                        >{month.labelHe}</Button>))}
                </ButtonGroup>}
                <Typography variant="subtitle1" component="h2" gutterBottom>
                    days
                </Typography>


                {date.month && <ButtonGroup>
                    {correctDays.map((day) => (
                        <Button
                            key={day}
                            onClick={() => setDate({ ...date, day: day })}
                            variant={date.day == day ? 'contained' : "outlined"}
                        >{`${day}||
                    ${new Date(date.year, date.month, day).getDay() + 1}`}</Button>))}
                </ButtonGroup>}
                {/* ---------------- */
