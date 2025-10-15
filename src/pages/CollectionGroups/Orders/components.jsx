import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    IconButton
} from "@mui/material";
import {
    useDroppable,
} from "@dnd-kit/core";
import {
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteIcon from "@mui/icons-material/Delete";
import { TextField } from "@mui/material";

// רכיב drop zone בין אלמנטים
export const DropZone = ({ id, isActive, draggedUser }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    if (!isActive) return null;

    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: isOver ? 60 : 8,
                transition: 'all 0.2s ease-out',
                margin: '2px 0',
                position: 'relative',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {isOver && draggedUser ? (
                <Box sx={{
                    opacity: 0.8,
                    transform: 'scale(0.95)',
                    transition: 'all 0.2s ease-out',
                    border: '2px solid #1976d2',
                    borderRadius: 1,
                    width: '100%',
                    backgroundColor: '#e3f2fd',
                }}>
                    <SortableUserItem
                        user={draggedUser}
                        showDragHandle={false}
                        onDelete={() => { }} // פונקציה ריקה ל-preview
                    />
                </Box>
            ) : (
                <Box
                    sx={{
                        height: isOver ? 4 : 2,
                        width: isOver ? '80%' : '60%',
                        backgroundColor: isOver ? '#1976d2' : '#90caf9',
                        borderRadius: 2,
                        opacity: isOver ? 1 : 0.5,
                        transition: 'all 0.2s ease-out',
                    }}
                />
            )}
        </Box>
    );
};

// רכיב קונטיינר שניתן להעביר אליו פריטים
export const DroppableContainer = ({ id, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <Box
            ref={setNodeRef}
            sx={{
                minHeight: 200,
                backgroundColor: isOver ? '#f0f8ff' : 'transparent',
                border: isOver ? '2px dashed #1976d2' : 'none',
                borderRadius: 2,
                transition: 'all 0.2s ease',
            }}
        >
            {children}
        </Box>
    );
};

// רכיב אחד של משתמש שניתן לגרירה
export const SortableUserItem = ({
    user,
    showDragHandle = true,
    onMoveToOrganized,
    onMoveInOrganized,
    isInOrganized = false,
    allUsers = [],
    currentIndex = 0,
    onOpenNextInput,
    forceOpenInput = false,
    onDelete
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: user.id });

    const [showPositionInput, setShowPositionInput] = useState(false);
    const [positionValue, setPositionValue] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const inputRef = useRef(null);

    // עדכן state כאשר יש בקשה לפתוח אינפוט מקומפוננטה אחרת
    useEffect(() => {
        if (forceOpenInput) {
            setShowPositionInput(true);
            setPositionValue('');
            // תמקד את האינפוט אחרי שהוא נפתח
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 50);
        }
    }, [forceOpenInput]);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handlePositionSubmit = () => {
        const position = parseInt(positionValue);

        if (position && position > 0) {
            if (isInOrganized && onMoveInOrganized) {
                onMoveInOrganized(user, position);
            } else if (!isInOrganized && onMoveToOrganized) {
                onMoveToOrganized(user, position);
            }

            setShowPositionInput(false);
            setPositionValue('');

            // פתח את האינפוט הבא - לוגיקה פשוטה
            setTimeout(() => {
                if (onOpenNextInput) {
                    let nextIndex;
                    if (!isInOrganized) {
                        // רשימה לא מסודרת - פתח את הכרטיס באותו מקום (כי הכרטיס הנוכחי נמחק)
                        nextIndex = currentIndex;
                    } else {
                        // רשימה מסודרת - פתח את הכרטיס הבא (אבל צריך לחסר 1 כי הכרטיס לא נמחק)
                        nextIndex = currentIndex;
                    }
                    console.log('Opening next input:', { nextIndex, isInOrganized });
                    onOpenNextInput(nextIndex);
                }
            }, 150);
        } else {
            setShowPositionInput(false);
            setPositionValue('');
        }
    };

    const handlePositionCancel = () => {
        setShowPositionInput(false);
        setPositionValue('');
        // איפוס האינפוט הפתוח
        if (onOpenNextInput) {
            onOpenNextInput(-1); // שליחת אינדקס לא חוקי לאיפוס
        }
    };

    const handleButtonClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowPositionInput(true);
        setPositionValue('');
        // תמקד את האינפוט אחרי שהוא נפתח
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 50);
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = () => {
        if (onDelete) {
            onDelete(user);
        }
        setShowDeleteConfirm(false);
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            sx={{
                mb: 0.5,
                cursor: 'default',
                '&:hover': {
                    boxShadow: 3,
                },
                border: isDragging ? '2px dashed #1976d2' : '1px solid #e0e0e0',
            }}
            {...attributes}
        >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box display="flex" alignItems="center">
                                <PersonIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                                <Typography variant="subtitle1" component="div" fontWeight={600}>
                                    {[user.deliveryIndex ? "(" + user.deliveryIndex + ") " : null, user.firstName, user.lastName].filter(Boolean).join(' ')}
                                </Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                                <LocationOnIcon sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                    {user.street}, {user.city}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={1}>
                        {/* אינפוט מיקום */}
                        {showPositionInput ? (
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <TextField
                                    ref={inputRef}
                                    size="small"
                                    type="number"
                                    value={positionValue}
                                    onChange={(e) => setPositionValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handlePositionSubmit();
                                        }
                                        if (e.key === 'Escape') {
                                            e.preventDefault();
                                            handlePositionCancel();
                                        }
                                    }}
                                    sx={{ width: 60 }}
                                    inputProps={{ min: 1 }}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePositionSubmit();
                                    }}
                                    sx={{ color: 'success.main' }}
                                >
                                    ✓
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePositionCancel();
                                    }}
                                    sx={{ color: 'error.main' }}
                                >
                                    ✕
                                </IconButton>
                            </Box>
                        ) : showDeleteConfirm ? (
                            /* אישור מחיקה */
                            <Box display="flex" alignItems="center" gap={0.5}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                    בטוח?
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteConfirm();
                                    }}
                                    sx={{ color: 'success.main' }}
                                >
                                    ✓
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteCancel();
                                    }}
                                    sx={{ color: 'error.main' }}
                                >
                                    ✕
                                </IconButton>
                            </Box>
                        ) : (
                            <>
                                {/* כפתור מחיקה */}
                                <IconButton
                                    size="small"
                                    onClick={handleDeleteClick}
                                    sx={{
                                        color: 'error.main',
                                        '&:hover': { bgcolor: 'error.lighter' }
                                    }}
                                    title="מחק הזמנה"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>

                                {/* כפתורי העברה */}
                                {!isInOrganized && onMoveToOrganized && (
                                    <IconButton
                                        size="small"
                                        onClick={handleButtonClick}
                                        sx={{
                                            color: 'success.main',
                                            '&:hover': { bgcolor: 'success.lighter' }
                                        }}
                                        title="העבר לעמודה המסודרת עם מספר"
                                    >
                                        <ArrowForwardIcon fontSize="small" />
                                    </IconButton>
                                )}

                                {isInOrganized && onMoveInOrganized && (
                                    <IconButton
                                        size="small"
                                        onClick={handleButtonClick}
                                        sx={{
                                            color: 'primary.main',
                                            '&:hover': { bgcolor: 'primary.lighter' }
                                        }}
                                        title="שנה מיקום במספר"
                                    >
                                        <ArrowForwardIcon fontSize="small" />
                                    </IconButton>
                                )}

                                {showDragHandle && (
                                    <Box
                                        {...listeners}
                                        sx={{
                                            cursor: 'grab',
                                            display: 'flex',
                                            alignItems: 'center',
                                            p: 0.5,
                                            borderRadius: 1,
                                            '&:hover': {
                                                bgcolor: 'grey.100',
                                                '& .drag-icon': { color: 'primary.main' }
                                            }
                                        }}
                                    >
                                        <DragIndicatorIcon
                                            className="drag-icon"
                                            sx={{
                                                color: 'text.secondary',
                                                transition: 'color 0.2s'
                                            }}
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};
