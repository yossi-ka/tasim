import React, { useState } from "react";
import {
    Card,
    Stepper,
    Step,
    StepLabel,
    StepButton,
    Box,
    Typography,
    Divider,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import ShoppingCart from "@mui/icons-material/ShoppingCart";
import Person from "@mui/icons-material/Person";
import TrackChanges from "@mui/icons-material/TrackChanges";
import CheckCircle from "@mui/icons-material/CheckCircle";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import OrdersManagement from './Orders';
import EmployeeProducts from './EmployeeProducts';
import Tracking from './Tracking';
import Completion from './Completion';
import { useMutation, useQuery } from "react-query";
import { getCollectionGroupById, getOpenCollectionGroups, getProccessingCollectionGroups } from "../../api/services/collectionGroups";
import LoadingData from "../../components/LoadingData";
import Context from "../../context";

const steps = [
    {
        label: 'הזמנות',
        icon: <ShoppingCart />,
        component: OrdersManagement
    },
    {
        label: 'מוצרים',
        icon: <Person />,
        component: EmployeeProducts
    },
    {
        label: 'מעקב',
        icon: <TrackChanges />,
        component: Tracking
    },
    // {
    //     label: 'סיום',
    //     icon: <CheckCircle />,
    //     component: Completion
    // }
];

const CollectionGroups = () => {

    const { getLookupName } = React.useContext(Context);

    const [activeStep, setActiveStep] = useState(0);

    const handleStep = (step) => () => {
        setActiveStep(step);
    };



    const CurrentComponent = steps[activeStep].component;

    const [currentCollectionGroup, setCurrentCollectionGroup] = useState(null);

    const openCollectionGroups = useQuery('openCollectionGroups', getProccessingCollectionGroups,
        {
            refetchOnWindowFocus: false,
            // refetchOnMount: false,
            // refetchOnReconnect: false,
            // enabled: user !== 'loading' && user !== null,
        }
    );

    React.useEffect(() => {
        if (openCollectionGroups.data && openCollectionGroups.data.length > 0) {
            setCurrentCollectionGroup(openCollectionGroups.data[0]);
        }
    }, [openCollectionGroups.data]);

    const getCollectionGroup = useMutation(id => getCollectionGroupById(id))

    const refetchCollectionGroup = async () => {

        const groupId = currentCollectionGroup?.id;
        if (!groupId) return;
        const group = await getCollectionGroup.mutateAsync(groupId);
        setCurrentCollectionGroup(group);
    };



    if (openCollectionGroups.isLoading) {
        return <LoadingData />;
    }

    if (openCollectionGroups.data && openCollectionGroups.data.length === 0) {
        return <Card sx={{ width: 1, height: "85vh", overflow: 'hidden' }}>
            <Stack direction="column"
                alignItems="center"
                spacing={4}
                justifyContent="center"
                sx={{ width: 1, height: 1 }}>
                <SearchOffIcon color='secondary' sx={{ fontSize: 100 }} />
                <Typography variant={"h2"} component='p' sx={{ color: "secondary.main" }}>
                    אין קבוצות ליקוט פתוחות
                </Typography>
                <Typography variant={"h4"} component='p' sx={{ color: "secondary.main" }}>
                    פתיחת קבוצה מתבצעת מתוך מסך הזמנות
                </Typography>
                <Typography variant={"h4"} component='p' sx={{ color: "secondary.main" }}>
                    בהצלחה ;)
                </Typography>
            </Stack></Card>
    }

    return (
        <Card sx={{ width: 1, height: "85vh", overflow: 'hidden' }}>
            <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* שורת הסטפר עם ToggleButton */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 1
                }}>
                    <ToggleButtonGroup
                        value={currentCollectionGroup ? currentCollectionGroup.id : ''}
                        exclusive
                        // onChange={(e, v) => setCurrentCollectionGroup(v)}
                        size="small"
                        orientation="vertical"
                        sx={{ height: 'auto' }}
                        color="primary"
                    >
                        <ToggleButton value="default" disabled>
                            קבוצת ליקוט
                        </ToggleButton>
                        {openCollectionGroups.data.map(group => <ToggleButton
                            value={group.id}
                            key={group.id}
                            onClick={() => setCurrentCollectionGroup(group)}>
                            {getLookupName("collectionsGroupLines", group.lineId)}
                        </ToggleButton>)}
                    </ToggleButtonGroup>

                    <Stepper
                        nonLinear
                        activeStep={activeStep}
                        sx={{
                            flex: 1,
                            '& .MuiStep-root': {
                                cursor: 'pointer',
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                            },
                            '& .MuiStepConnector-line': {
                                borderTopWidth: 3,
                                borderColor: 'primary.main',
                            },
                            '& .MuiStepConnector-root': {
                                top: '28px',
                                left: 'calc(-50% + 10px)',
                                right: 'calc(50% + 10px)',
                            },
                            '& .MuiStepIcon-root': {
                                display: 'none', // מסתיר את האייקון הברירת מחדל
                            },
                        }}
                    >
                        {steps.map((step, index) => (
                            <Step key={step.label}>
                                <StepButton
                                    color="inherit"
                                    onClick={handleStep(index)}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '100%',
                                        padding: '2px',
                                        margin: 0,
                                    }}
                                >
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        width: '100%'
                                    }}>
                                        <Box sx={{
                                            fontSize: '1.8rem',
                                            color: '#fff',
                                            backgroundColor: index === activeStep ? 'primary.main' : 'grey.400',
                                            borderRadius: '50%',
                                            width: '56px',
                                            height: '56px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '2px solid',
                                            borderColor: index === activeStep ? 'primary.dark' : 'grey.400',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'scale(1.1)',
                                                backgroundColor: 'primary.main',
                                                borderColor: 'primary.dark',
                                            },
                                            mb: 0.25
                                        }}>
                                            {step.icon}
                                        </Box>
                                        <Box sx={{
                                            fontSize: '0.75rem',
                                            color: index === activeStep ? 'primary.main' : 'text.primary',
                                            textAlign: 'center',
                                            fontWeight: index === activeStep ? 'bold' : 'normal',
                                            width: '100%'
                                        }}>
                                            <Typography variant="body2" component="span">
                                                {step.label}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </StepButton>
                            </Step>
                        ))}
                    </Stepper>
                </Box>

                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    <CurrentComponent
                        refetchCollectionGroup={refetchCollectionGroup}
                        currentCollectionGroup={currentCollectionGroup} />
                </Box>
            </Box>
        </Card>
    );
};

export default CollectionGroups;
