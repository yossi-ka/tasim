import React from 'react';

import { Box, Stepper, Step, StepLabel, StepContent, Stack, StepIcon, Typography, Button, Alert } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

import { isFunction } from '../../utils/func';

const GenericStepper = ({ steps, finish, height }) => {

    const [activeStep, setActiveStep] = React.useState(0);
    const handleNext = () => {
        let stop = finish ? steps.length : steps.length - 1;
        if (activeStep == stop) return;
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };
    const handleBack = () => {
        if (activeStep == 0) return;
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const labelColor = (index) => {
        if (index == activeStep) return 'primary.main';
        if (index < activeStep) return 'success.main';
        if (index > activeStep) return 'disabled.main';
    }

    return (
        <Box>
            <Stepper activeStep={activeStep}>
                {steps.map((step, index) => {
                    return (
                        <Step key={index}>
                            <StepLabel
                                icon={<>
                                    {index == activeStep && <ArrowDropDownIcon color='primary' />}
                                    {index < activeStep && <CheckIcon color='success' />}
                                    {index > activeStep && <CloseIcon color='disabled' />}
                                </>}
                            >
                                <Typography
                                    variant={index == activeStep ? 'subtitle2' : 'body1'}
                                    color={labelColor(index)}
                                >{step.label}</Typography>
                            </StepLabel>
                        </Step>
                    )
                })}
            </Stepper>
            <Box sx={{ p: 2, pt: 3 }}>
                <Box sx={{ height }}>
                    {steps[activeStep].noData && <Alert severity='error'>אין נתונים להצגה בשלב זה</Alert>}
                    {(activeStep < steps.length)
                        ? isFunction(steps[activeStep].content)
                            ? steps[activeStep].content({ activeStep, setActiveStep, handleBack, handleNext })
                            : steps[activeStep].content
                        : null}
                    {(activeStep == steps.length && finish) && <>Fin</>}
                </Box>
                <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ width: 1, mt: 3 }}>
                    <Button
                        size='small'
                        variant='contained'
                        startIcon={<KeyboardDoubleArrowRightIcon />}
                        disabled={steps[activeStep]?.back?.disabled || false}
                        onClick={() => {
                            steps[activeStep]?.back?.onClick?.({ activeStep, setActiveStep, handleBack, handleNext }) || handleBack();
                        }}
                    >
                        {steps[activeStep]?.back?.label || 'הקודם'}
                    </Button>
                    {(activeStep < steps.length) && <Button
                        size='small'
                        variant='contained'
                        endIcon={<KeyboardDoubleArrowLeftIcon />}
                        disabled={steps[activeStep]?.next?.disabled || false}
                        onClick={() => {
                            steps[activeStep]?.next?.onClick?.({ activeStep, setActiveStep, handleBack, handleNext }) || handleNext();
                        }}
                    >
                        {steps[activeStep]?.next?.label || 'הבא'}
                    </Button>}
                </Stack>
            </Box>
        </Box>
    )
}

GenericStepper.defaultProps = {
    finish: null,
    height: null
}

export default GenericStepper