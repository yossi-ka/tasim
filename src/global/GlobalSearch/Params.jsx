import React from "react";



import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SearchIcon from '@mui/icons-material/Search';

import { Grid, Tooltip, IconButton, Stack, Typography, Box, useTheme, useMediaQuery } from "@mui/material";

import { isEmpty, isEmptyWithoutZiro } from "../../utils/func";
import GenericForm from "../../components/GenericForm";
const Params = ({ setCollapseOpen, quickSearchFields, quickSearchOnTyping, header, cb, actions,
    initInputs, setInitInputs, params, setParams,
    valueToDisplay, saveToSessionStorage, onSubmit,
    terms
}) => {

    const theme = useTheme();
    const isNotPhoneScreen = useMediaQuery(theme.breakpoints.up('sm'))

    const cbParams = React.useMemo(() => {
        if (!cb || !cb.params) return [];
        return cb.params.filter(item => !isEmpty(item.text));
    }, [cb]);

    //עבור חיפוש מהיר
    const [typingTimeout, setTypingTimeout] = React.useState(null);

    const paramsHeader = React.useMemo(() => {
        const newParams = {};
        for (const key in params) {
            if (key == "globalSearch") continue;
            if (isEmptyWithoutZiro(params[key])) continue;
            newParams[key] = params[key];
        }
        return newParams;
    }, [params]);

    return (
        <Grid container spacing={2} id="test1">
            {isNotPhoneScreen && <Grid item xs={0.5}>
                <Stack direction='row' justifyContent="start" alignItems="center" spacing={4} sx={{ width: 1, height: 1 }}>
                    <Tooltip title='חיפוש מורחב'>
                        <IconButton onClick={() => setCollapseOpen(collapseOpen => !collapseOpen)}>
                            <SearchIcon color='primary' fontSize='large' />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Grid>}
            {quickSearchFields.length > 0 && <Grid item xs={quickSearchFields.length > 0 ? (isNotPhoneScreen ? 2 : 4) : null}>
                <Stack direction="column" alignItems="center" justifyContent="center" sx={{ width: 1, height: 1 }}>
                    <GenericForm
                        isEnterPress={true}
                        fields={quickSearchFields}
                        initInputs={initInputs}
                        setInitInput={(inputs) => {
                            setInitInputs(inputs);
                            // if (quickSearchOnTyping) {
                            //     setTimeout(() => {
                            //         console.log('onSubmit', inputs);
                            //         onSubmit(inputs);
                            //     }, 1000);
                            // }

                            if (quickSearchOnTyping) {
                                if (typingTimeout) {
                                    clearTimeout(typingTimeout);
                                    setTypingTimeout(null);
                                }
                                setTypingTimeout(setTimeout(() => {
                                    onSubmit(inputs);
                                }, 500));


                            }
                        }}
                        onSubmit={(inputs) => {
                            onSubmit(inputs);
                        }}
                    />
                </Stack>
            </Grid>}
            {isNotPhoneScreen && <Grid item xs={quickSearchFields.length > 0 ? (header ? 6.5 : 7.5) : (header ? 8.5 : 9.5)}>
                <Stack direction='row' justifyContent="start" alignItems="center" spacing={4} sx={{ width: 1, height: 1 }}>
                    {Object.keys(paramsHeader).length === 0 && cbParams.length == 0 && <Typography
                        variant='body1'
                        color="text.secondary"
                        sx={{ width: 1 }}
                    >
                        לא נבחרו פרמטרים לחיפוש
                    </Typography>}

                    {Object.keys(paramsHeader).map((key, index) => <Param
                        key={index}
                        label={terms.getLabel(key)}
                        text={valueToDisplay(key)}
                        onClick={() => {
                            const newInitInputs = { ...params };
                            delete newInitInputs[key];
                            setInitInputs(newInitInputs);
                            saveToSessionStorage({ params: newInitInputs });
                            setParams(newInitInputs);
                        }}
                    />)}
                    {cbParams.map((item, index) => <Param
                        key={index}
                        label={item.label}
                        text={item.text}
                        onClick={() => item.onClick({ item, params, setParams })}
                    />)}
                </Stack>
            </Grid>}
            <Grid item xs={isNotPhoneScreen ? (header ? 3 : 2) : 8}>
                {(actions || header) && <Stack direction='row' justifyContent="space-between" alignItems="center" spacing={0} sx={{ width: 1, height: 1 }}>
                    <Box>
                        {header && header}
                    </Box>
                    <Box>
                        {actions.filter(a => a).map((action, index) => {
                            return (
                                <Tooltip key={index} title={action.title}>
                                    <IconButton onClick={(e) => action.onClick(e)}>
                                        {action.icon}
                                    </IconButton>
                                </Tooltip>
                            )
                        })}
                    </Box>

                </Stack>}
            </Grid>
        </Grid>
    )
}

export default Params;

const Param = ({ label, text, onClick }) => <Box >
    <Stack direction='row' justifyContent="start" alignItems="center" spacing={0} sx={{ width: 1, height: 1 }}>
        <IconButton
            size='small'
            onClick={() => {
                onClick();
            }}>
            <CloseIcon color='error' sx={{ fontSize: 14 }} />
        </IconButton>
        <Typography variant='caption' color='text.secondary'>{label}</Typography>
    </Stack>
    <Typography variant='subtitle2' color="primary.main" align='center' sx={{ mt: -0.5 }}>{text}</Typography>
</Box>