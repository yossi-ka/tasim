import React, { useState } from "react";
import {
    Box,
    Typography,
    Button,
    Grid,
    Paper,
    Chip,
} from "@mui/material";
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SaveIcon from "@mui/icons-material/Save";

import { DropZone, DroppableContainer, SortableUserItem } from './components';

import {
    customCollisionDetection,
    handleDragStart,
    handleDragEnd,
    handleMoveToOrganized,
    handleMoveInOrganized
} from './handlers';
import { useMutation, useQuery } from "react-query";
import { closeCollectionGroup, getOrdersByCollectionGroup, saveCollectionGroupOrder } from "../../../api/services/collectionGroups";
import Context from "../../../context";
import LoadingCloseCollection from "./LoadingCloseCollection";

const OrdersManagement = ({ currentCollectionGroup, refetchCollectionGroup }) => {

    const { user, snackbar, confirm } = React.useContext(Context);
    const [unorganizedUsers, setUnorganizedUsers] = useState([]);
    const [organizedUsers, setOrganizedUsers] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [draggedUser, setDraggedUser] = useState(null);
    const [openInputIndex, setOpenInputIndex] = useState({ list: null, index: null });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);


    const { data: orders, refetch: refetchOrders } = useQuery(
        ['getOrdersByCollectionGroup', currentCollectionGroup?.id],
        () => getOrdersByCollectionGroup(currentCollectionGroup?.id),
        {
            enabled: !!currentCollectionGroup?.id, // רק אם יש קבוצת איסוף פעילה
            refetchOnWindowFocus: false, // לא לרענן אוטומטית כשחלון הדפדפן מתמקד
        }
    );

    const isAllowToColse = React.useMemo(() => {
        if (!orders) return false;
        return orders.every(order => order.collectionGroupOrder > 0);
    }, [orders]);

    React.useEffect(() => {
        if (orders) {
            const organized = orders.filter(order => order.collectionGroupOrder > 0)
                .sort((a, b) => a.collectionGroupOrder - b.collectionGroupOrder);
            setOrganizedUsers(organized);

            const unorganized = orders.filter(order => order.collectionGroupOrder === 0)
            setUnorganizedUsers(unorganized);

            // איפוס מצב השינויים כשנטענים נתונים חדשים מהשרת
            setHasUnsavedChanges(false);
        }
    }, [orders]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // פונקציות מעטפת לטיפול באירועים
    const onDragStart = (event) => {
        handleDragStart(event, unorganizedUsers, organizedUsers, setActiveId, setDraggedUser);
    };

    const onDragEnd = (event) => {
        const result = handleDragEnd(event, unorganizedUsers, organizedUsers, setUnorganizedUsers, setOrganizedUsers, setActiveId, setDraggedUser);
        // אם היה שינוי, סמן שיש שינויים לא שמורים
        if (result) {
            setHasUnsavedChanges(true);
        }
    };

    const onMoveToOrganized = (user, position) => {
        handleMoveToOrganized(user, position, organizedUsers, setUnorganizedUsers, setOrganizedUsers);
        setHasUnsavedChanges(true); // סימון שיש שינויים לא שמורים
        // איפוס מצב האינפוט אחרי העברה עם עיכוב לעדכון הרשימות
        setTimeout(() => {
            setOpenInputIndex({ list: null, index: null });
        }, 50);
    };

    const onMoveInOrganized = (user, position) => {
        handleMoveInOrganized(user, position, organizedUsers, setOrganizedUsers);
        setHasUnsavedChanges(true); // סימון שיש שינויים לא שמורים
        // איפוס מצב האינפוט אחרי העברה עם עיכוב לעדכון הרשימות  
        setTimeout(() => {
            setOpenInputIndex({ list: null, index: null });
        }, 50);
    };


    const saveOrder = useMutation(data => saveCollectionGroupOrder(
        currentCollectionGroup.id,
        organizedUsers,
        unorganizedUsers,
        user.id),
        {
            onSuccess: (res) => {
                if (res.unorganizedCount === 0) {
                    confirm({
                        message: "כל ההזמנות סודרו בהצלחה. האם ברצונך לסגור את הקבוצה?",
                        onConfirm: () => closeCollection.mutate(),
                    })
                }
                refetchOrders();
                setHasUnsavedChanges(false); // איפוס מצב השינויים אחרי שמירה מוצלחת
                snackbar("העדכון נשמר בהצלחה")

            },
            onError: (error) => {
                console.error("Error saving order:", error);
                snackbar("שגיאה בשמירה, אנא נסה שוב", "error");
            }
        }
    );

    const closeCollection = useMutation(() => closeCollectionGroup(currentCollectionGroup.id, user.id),
        {
            onSuccess: () => {
                refetchCollectionGroup();
                snackbar("הקבוצה נסגרה בהצלחה");
            },
            onError: (error) => {
                console.error("Error closing collection group:", error);
                snackbar("שגיאה בסגירת הקבוצה, אנא נסה שוב", "error");
            }
        }
    );



    // פונקציות לניהול פתיחת אינפוטים ברצף
    const handleOpenNextInputUnorganized = (nextIndex) => {
      

        if (nextIndex === -1) {
            // איפוס
            setOpenInputIndex({ list: null, index: null });
            return;
        }

        // בדוק שהאינדקס תקין ושיש עוד כרטיסים ברשימה
        if (nextIndex >= 0 && nextIndex < unorganizedUsers.length) {
            setOpenInputIndex({ list: 'unorganized', index: nextIndex });
        } else {
            setOpenInputIndex({ list: null, index: null });
        }
    };

    const handleOpenNextInputOrganized = (nextIndex) => {
       

        if (nextIndex === -1) {
            // איפוס
            setOpenInputIndex({ list: null, index: null });
            return;
        }

        // בדוק שהאינדקס תקין ושיש עוד כרטיסים ברשימה
        if (nextIndex >= 0 && nextIndex < organizedUsers.length) {
            setOpenInputIndex({ list: 'organized', index: nextIndex });
        } else {
            setOpenInputIndex({ list: null, index: null });
        }
    };

    if (closeCollection.isLoading) {
        return <LoadingCloseCollection />
    }
    if (currentCollectionGroup?.status === 2) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" mb={3} textAlign="center">
                    הזמנות מסודרות - צפייה
                </Typography>

                <Grid container spacing={2}>
                    {organizedUsers.map((user, index) => {

                        return (
                            <Grid item xs={12} sm={6} md={3} key={user.id}>
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 1.5,
                                        mb: 1,
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        backgroundColor: '#f8f9fa',
                                        position: 'relative',
                                        // minHeight: 120
                                    }}
                                >
                                    {/* מספר סידורי בפינה ימנית עליונה */}
                                    <Chip
                                        label={index + 1}
                                        size="small"
                                        color="primary"
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            // minWidth: 28,
                                            // height: 28,
                                            fontWeight: 'bold',
                                            fontSize: '0.75rem'
                                        }}
                                    />

                                    <Box sx={{ pt: 1, pr: 5 }}>
                                        <Typography variant="subtitle1" component="div" fontWeight={600} sx={{ mb: 0.5 }}>
                                            {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                                        </Typography>

                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                                            📍 {user.address || `${user.street}, ${user.city}`}
                                        </Typography>

                                        {/* {user.phone && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontSize: '0.8rem' }}>
                                                📞 {user.phone}
                                            </Typography>
                                        )}

                                        {user.totalAmount && (
                                            <Typography variant="body2" color="primary.main" fontWeight={500} sx={{ fontSize: '0.8rem' }}>
                                                💰 ₪{user.totalAmount}
                                            </Typography>
                                        )}

                                        {user.notes && (
                                            <Typography variant="body2" color="warning.main" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                                                📝 {user.notes}
                                            </Typography>
                                        )} */}
                                    </Box>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>

                {organizedUsers.length === 0 && (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        minHeight={300}
                        color="text.secondary"
                    >
                        <Typography variant="h5" textAlign="center">
                            אין הזמנות להצגה
                        </Typography>
                    </Box>
                )}

                <Box display="flex" justifyContent="center" mt={4}>
                    <Typography variant="body1" color="text.secondary">
                        סה"כ הזמנות: {organizedUsers.length}
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>

            <DndContext
                sensors={sensors}
                collisionDetection={customCollisionDetection}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            >
                <Grid container spacing={3}>
                    {/* עמודה ימין - משתמשים לא מסודרים (במצב RTL) */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '60vh', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h5" component="h2">
                                    הזמנות לסידור
                                </Typography>
                                <Chip
                                    label={unorganizedUsers.length}
                                    color="warning"
                                    size="small"
                                />
                            </Box>

                            <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
                                <DroppableContainer id="unorganized">
                                    <SortableContext
                                        items={unorganizedUsers.map(user => user.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {unorganizedUsers.map((user, index) => (
                                            <SortableUserItem
                                                key={user.id}
                                                user={user}
                                                showDragHandle={true}
                                                onMoveToOrganized={onMoveToOrganized}
                                                isInOrganized={false}
                                                allUsers={unorganizedUsers}
                                                currentIndex={index}
                                                onOpenNextInput={handleOpenNextInputUnorganized}
                                                forceOpenInput={openInputIndex.list === 'unorganized' && openInputIndex.index === index}
                                            />
                                        ))}
                                    </SortableContext>

                                    {unorganizedUsers.length === 0 && (
                                        <Box
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                            minHeight={200}
                                            color="text.secondary"
                                        >
                                            <Typography variant="body1" textAlign="center">
                                                כל הכבוד!
                                                <br />
                                                כל ההזמנות מסודרות
                                            </Typography>
                                        </Box>
                                    )}
                                </DroppableContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* עמודה שמאל - משתמשים מסודרים (במצב RTL) */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '60vh', display: 'flex', flexDirection: 'column' }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h5" component="h2">
                                    הזמנות מסודרות
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2}>

                                    {organizedUsers.length > 0 && hasUnsavedChanges && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<SaveIcon />}
                                            onClick={saveOrder.mutate}
                                            disabled={saveOrder.isLoading}
                                            
                                            sx={{
                                                px: 2,
                                                py: 0.5,
                                                backgroundColor: hasUnsavedChanges ? 'warning.main' : 'primary.main',
                                                '&:hover': {
                                                    backgroundColor: hasUnsavedChanges ? 'warning.dark' : 'primary.dark'
                                                }
                                            }}
                                        >
                                            {hasUnsavedChanges ? 'שמור שינויים' : 'שמור סדר'}
                                        </Button>
                                    )}
                                    {isAllowToColse && !hasUnsavedChanges && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<SaveIcon />}
                                            onClick={closeCollection.mutate}
                                            sx={{ px: 2, py: 0.5 }}
                                            color="success"
                                        >
                                            נעילה וסיום
                                        </Button>
                                    )}
                                    <Chip
                                        label={organizedUsers.length}
                                        color="success"
                                        size="small"
                                    />
                                </Box>
                            </Box>

                            <Box sx={{ flex: 1, overflow: 'auto', pr: 1, display: 'flex', flexDirection: 'column' }}>
                                <DroppableContainer id="organized">
                                    <SortableContext
                                        items={organizedUsers.map(user => user.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {/* Drop zone בתחילת הרשימה */}
                                        <DropZone
                                            id="dropzone-organized-0"
                                            isActive={activeId !== null}
                                            draggedUser={draggedUser}
                                        />

                                        {organizedUsers.map((user, index) => (
                                            <React.Fragment key={user.id}>
                                                <Box display="flex" alignItems="center">
                                                    <Chip
                                                        label={index + 1}
                                                        size="small"
                                                        sx={{ mr: 1, minWidth: 32 }}
                                                        color="primary"
                                                    />
                                                    <Box flex={1}>
                                                        <SortableUserItem
                                                            user={user}
                                                            showDragHandle={true}
                                                            onMoveInOrganized={onMoveInOrganized}
                                                            isInOrganized={true}
                                                            allUsers={organizedUsers}
                                                            currentIndex={index}
                                                            onOpenNextInput={handleOpenNextInputOrganized}
                                                            forceOpenInput={openInputIndex.list === 'organized' && openInputIndex.index === index}
                                                        />
                                                    </Box>
                                                </Box>
                                                {/* Drop zone אחרי כל אלמנט */}
                                                <DropZone
                                                    id={`dropzone-organized-${index + 1}`}
                                                    isActive={activeId !== null}
                                                    draggedUser={draggedUser}
                                                />
                                            </React.Fragment>
                                        ))}
                                    </SortableContext>

                                    {organizedUsers.length === 0 && (
                                        <Box
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                            minHeight={200}
                                            color="text.secondary"
                                            sx={{
                                                border: '2px dashed #ccc',
                                                borderRadius: 2,
                                                backgroundColor: '#f9f9f9'
                                            }}
                                        >
                                            <Typography variant="body1">
                                                גרור הזמנות לכאן כדי לסדר אותם
                                            </Typography>
                                        </Box>
                                    )}
                                </DroppableContainer>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* DragOverlay לחווית משתמש טובה יותר */}
                <DragOverlay>
                    {activeId && draggedUser ? (
                        <SortableUserItem
                            user={draggedUser}
                            showDragHandle={false}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </Box>
    );
};

export default OrdersManagement;
