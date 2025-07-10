import {
    Button,
    Stack,
    Typography,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Box,
    Divider,
    Alert
} from "@mui/material";
import React, { useState, useEffect } from "react";
import { useQuery } from 'react-query';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { getLatestImportStatus } from '../../api/services/orders';
// import { refreshOrders } from "../../api/services/importOrders";
import { checkLocalSyncService, triggerLocalSync } from '../../api/services/localSyncService';
import Context from "../../context";

const SyncStatus = ({ refetch }) => {

    const { user } = React.useContext(Context);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLocalSyncAvailable, setIsLocalSyncAvailable] = useState(null); // null=unknown, true=ok, false=down
    // בדיקת זמינות סנכרון מקומי בכניסה לקומפוננטה
    useEffect(() => {
        const checkService = async () => {
            const available = await checkLocalSyncService();
            setIsLocalSyncAvailable(available);
        };
        checkService();
    }, []);

    // קריאה לנתונים האחרונים
    const { data: latestImport, isLoading, error, refetch: refetchStatus } = useQuery(
        'latestImportStatus',
        getLatestImportStatus,
        {
            refetchInterval: 30000, // רענון כל 30 שניות
            refetchOnWindowFocus: true
        }
    );

    // פונקציה לעיצוב הסטטוס
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'completed':
                return {
                    color: 'success',
                    icon: <CheckCircleIcon />,
                    text: 'הושלם בהצלחה'
                };
            case 'failed':
                return {
                    color: 'error',
                    icon: <ErrorIcon />,
                    text: 'נכשל'
                };
            case 'started':
                return {
                    color: 'info',
                    icon: <ScheduleIcon />,
                    text: 'בביצוע'
                };
            default:
                return {
                    color: 'default',
                    icon: <ScheduleIcon />,
                    text: 'לא ידוע'
                };
        }
    };

    // פונקציה לעיצוב תאריך
    const formatDate = (date) => {
        if (!date) return 'לא זמין';
        return new Date(date).toLocaleString('he-IL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // פונקציה לחישוב משך זמן
    const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return 'לא זמין';
        const duration = new Date(endDate) - new Date(startDate);
        const seconds = Math.floor(duration / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes > 0) {
            return `${minutes} דקות ו-${remainingSeconds} שניות`;
        }
        return `${remainingSeconds} שניות`;
    };

    // פונקציה לחידוש בדיקת שירות מקומי
    const handleCheckAgain = async () => {
        setIsRefreshing(true);
        const available = await checkLocalSyncService();
        setIsLocalSyncAvailable(available);
        setIsRefreshing(false);
    };

    // פונקציה לטיפול ברענון ידני
    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            // אם הסנכרון המקומי זמין, מבצע דרכו
            await triggerLocalSync();

            await refetchStatus();
            await refetch();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsRefreshing(false);
        }
    };


    if (isLoading || isLocalSyncAvailable === null) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
                <Typography variant="h6" sx={{ ml: 2 }}>טוען נתוני סנכרון...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error">
                שגיאה בטעינת נתוני הסנכרון: {error.message}
            </Alert>
        );
    }

    if (!latestImport) {
        return (
            <Stack spacing={3}>
                <Typography variant="h4" color="primary.main">
                    סטטוס סנכרון הזמנות
                </Typography>

                <Alert severity="info">
                    לא נמצאו נתוני סנכרון. הסנכרון הראשון עדיין לא התבצע.
                </Alert>

                <Box display="flex" justifyContent="center">
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={handleManualRefresh}
                        size="large"
                        disabled={isRefreshing || isLocalSyncAvailable === false}
                    >
                        {isRefreshing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                        ביצוע סנכרון ראשון
                    </Button>
                </Box>
            </Stack>
        );
    }

    const statusDisplay = getStatusDisplay(latestImport?.status);

    return (
        <Stack spacing={3}>
            <Card elevation={3}>
                <CardContent>
                    <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="h5" component="h2">
                                סנכרון אחרון
                            </Typography>
                            <Chip
                                icon={statusDisplay.icon}
                                label={statusDisplay.text}
                                color={statusDisplay.color}
                                variant="outlined"
                            />
                        </Box>

                        <Divider />

                        <Stack spacing={2}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    תאריך התחלה:
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(latestImport?.createdAt)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    תאריך סיום:
                                </Typography>
                                <Typography variant="body1">
                                    {formatDate(latestImport?.complitedAt)}
                                </Typography>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    משך זמן:
                                </Typography>
                                <Typography variant="body1">
                                    {calculateDuration(latestImport?.createdAt, latestImport?.complitedAt)}
                                </Typography>
                            </Box>

                            {latestImport?.totalNewOrders !== undefined && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        הזמנות חדשות שנוספו:
                                    </Typography>
                                    <Typography variant="h6" color="primary.main">
                                        {latestImport.totalNewOrders.toLocaleString()}
                                    </Typography>
                                </Box>
                            )}

                            {latestImport?.totalProductsAdded !== undefined && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        מוצרים שנוספו:
                                    </Typography>
                                    <Typography variant="h6" color="secondary.main">
                                        {latestImport.totalProductsAdded.toLocaleString()}
                                    </Typography>
                                </Box>
                            )}

                            {latestImport?.message && (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        הודעה:
                                    </Typography>
                                    <Typography variant="body2">
                                        {latestImport.message}
                                    </Typography>
                                </Box>
                            )}
                        </Stack>

                        <Divider />

                        <Box display="flex" justifyContent="center" gap={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<RefreshIcon />}
                                onClick={handleManualRefresh}
                                size="large"
                                disabled={isRefreshing || isLocalSyncAvailable === false}
                            >
                                {isRefreshing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                                ביצוע רענון ידני
                            </Button>
                            {isLocalSyncAvailable === false && (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    onClick={handleCheckAgain}
                                    disabled={isRefreshing}
                                >
                                    בדוק שוב שירות מקומי
                                </Button>
                            )}
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {isLocalSyncAvailable === false && (
                <Alert severity="error">
                    שירות הסנכרון המקומי אינו פעיל. יש להפעיל את השירות במחשב זה.<br />
                    לא ניתן לבצע סנכרון הזמנות דרך שירות זה.
                </Alert>
            )}

            <Alert severity="info">
                <Typography variant="body2">
                    הסנכרון לא פועל בצורה אוטומטית וכרגע נדרש לבצע רענון ידני.
                </Typography>
            </Alert>
        </Stack>
    );
};

export default SyncStatus;
