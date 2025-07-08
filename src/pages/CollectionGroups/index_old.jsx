import React, { useState } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Grid,
    Paper,
    Chip,
    IconButton
} from "@mui/material";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
    closestCorners,
    pointerWithin,
    rectIntersection,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { TextField } from "@mui/material";

// רכיב drop zone בין אלמנטים
const DropZone = ({ id, isActive, draggedUser }) => {
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
const DroppableContainer = ({ id, children }) => {
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
const SortableUserItem = ({ user, showDragHandle = true, onMoveToOrganized, onMoveInOrganized, isInOrganized = false }) => {
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
        }
        setShowPositionInput(false);
        setPositionValue('');
    };

    const handlePositionCancel = () => {
        setShowPositionInput(false);
        setPositionValue('');
    };

    const handleButtonClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setShowPositionInput(true);
        setPositionValue('');
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
                                    {user.name}
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
                                    size="small"
                                    type="number"
                                    value={positionValue}
                                    onChange={(e) => setPositionValue(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handlePositionSubmit();
                                        }
                                        if (e.key === 'Escape') {
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
                        ) : (
                            <>
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

const CollectionGroups = () => {
    // הוספת ID ייחודי לכל משתמש
    const initialData = [
        { id: "1", name: "שלמה כהן", street: "הנשיא 1", city: "תל אביב", phone: "050-1234567" },
        { id: "2", name: "מיכל לוי", street: "המלך ג'ורג'", city: "ירושלים", phone: "050-7654321" },
        { id: "3", name: "אבי ישראלי", street: "הרצל 10", city: "חיפה", phone: "050-9876543" },
        { id: "4", name: "שרה פרידמן", street: "השלום 5", city: "באר שבע", phone: "050-4567890" },
        { id: "5", name: "דוד כהן", street: "הגפן 3", city: "פתח תקווה", phone: "050-3216549" },
        { id: "6", name: "רחל לוי", street: "הדקל 7", city: "ראשון לציון", phone: "050-6543210" },
        { id: "7", name: "יוסי ישראלי", street: "החרמון 2", city: "נתניה", phone: "050-7894561" },
        { id: "8", name: "אורית פרידמן", street: "הכרמל 4", city: "אשדוד", phone: "050-1237894" },
        { id: "9", name: "מאיר כהן", street: "הגפן 6", city: "רמלה", phone: "050-4561237" },
        { id: "10", name: "תמר לוי", street: "הדקל 8", city: "בני ברק", phone: "050-3219876" },
        { id: "11", name: "משה רוזן", street: "רוטשילד 15", city: "תל אביב", phone: "050-1112223" },
        { id: "12", name: "עינת שלום", street: "בן יהודה 12", city: "ירושלים", phone: "050-4445556" },
        { id: "13", name: "אמיר גולד", street: "דיזנגוף 88", city: "תל אביב", phone: "050-7778889" },
        { id: "14", name: "נועה ברק", street: "הרב קוק 23", city: "ראשון לציון", phone: "050-2223334" },
        { id: "15", name: "יובל נחמן", street: "אבן גבירול 45", city: "תל אביב", phone: "050-5556667" },
        { id: "16", name: "ליאור שמש", street: "הנביאים 67", city: "ירושלים", phone: "050-8889990" },
        { id: "17", name: "גלי זוהר", street: "יפו 123", city: "תל אביב", phone: "050-1234560" },
        { id: "18", name: "רון דהן", street: "השלום 34", city: "חיפה", phone: "050-9876540" },
        { id: "19", name: "מיטל אור", street: "הגליל 56", city: "נתניה", phone: "050-5554443" },
        { id: "20", name: "אלעד בן דוד", street: "הכרמל 78", city: "חיפה", phone: "050-7776665" },
        { id: "21", name: "שירה מלכה", street: "המייסדים 90", city: "פתח תקווה", phone: "050-3332221" },
        { id: "22", name: "עומר נגר", street: "הסתדרות 12", city: "באר שבע", phone: "050-6665554" },
        { id: "23", name: "הדר פז", street: "הנצחון 34", city: "ראשון לציון", phone: "050-8887776" },
        { id: "24", name: "תומר רם", street: "השקד 56", city: "רמת גן", phone: "050-4443332" },
        { id: "25", name: "מורן שחר", street: "האלון 78", city: "הרצליה", phone: "050-1110009" },
        { id: "26", name: "איתי גבע", street: "הדפנה 90", city: "כפר סבא", phone: "050-2229998" },
        { id: "27", name: "ענת רוני", street: "הורד 12", city: "רעננה", phone: "050-3338887" },
        { id: "28", name: "בועז שני", street: "הסחלב 34", city: "גבעתיים", phone: "050-6667776" },
        { id: "29", name: "ליה טוב", street: "הלוטוס 56", city: "בת ים", phone: "050-9990008" },
        { id: "30", name: "אסף נור", street: "הפרח 78", city: "חולון", phone: "050-7778887" },
        { id: "31", name: "דנה יפה", street: "הנרקיס 90", city: "רמלה", phone: "050-5556665" },
        { id: "32", name: "גיא אמיר", street: "הציפורן 12", city: "לוד", phone: "050-4445554" },
        { id: "33", name: "רעות שיר", street: "הפריחה 34", city: "מודיעין", phone: "050-1112221" },
        { id: "34", name: "עידו נועם", street: "הפיקוס 56", city: "אילת", phone: "050-8889998" },
        { id: "35", name: "קרן אלה", street: "האורן 78", city: "בית שמש", phone: "050-2223332" },
        { id: "36", name: "אדם חי", street: "הארז 90", city: "אשקלון", phone: "050-3334443" },
        { id: "37", name: "יעל צור", street: "התאנה 12", city: "עכו", phone: "050-6667778" },
        { id: "38", name: "חגי דור", street: "הזית 34", city: "טבריה", phone: "050-9998887" },
        { id: "39", name: "שני בר", street: "הרימון 56", city: "צפת", phone: "050-7776665" },
        { id: "40", name: "ניר גל", street: "התמר 78", city: "קריית גת", phone: "050-4443331" },
        { id: "41", name: "מיה זר", street: "הקדוש 90", city: "דימונה", phone: "050-1119990" },
        { id: "42", name: "רועי אל", street: "הבושם 12", city: "ערד", phone: "050-5558881" },
        { id: "43", name: "אירית טל", street: "המרווה 34", city: "מצפה רמון", phone: "050-8882220" },
        { id: "44", name: "זיו רן", street: "הלבנדר 56", city: "קריית שמונה", phone: "050-2225553" },
        { id: "45", name: "לירון יש", street: "הרוזמרין 78", city: "בית שאן", phone: "050-6669992" },
        { id: "46", name: "ספיר חן", street: "הזעתר 90", city: "נהריה", phone: "050-3336664" },
        { id: "47", name: "אורן פן", street: "הכוסברה 12", city: "קרית ביאליק", phone: "050-7774442" },
        { id: "48", name: "טליה רז", street: "הפטרוזיליה 34", city: "טירת כרמל", phone: "050-4447775" },
        { id: "49", name: "נתן גן", street: "הבזיליקום 56", city: "נשר", phone: "050-1116663" },
        { id: "50", name: "מלכה שם", street: "האורגנו 78", city: "יקנעם", phone: "050-8885552" }
    ];

    const [unorganizedUsers, setUnorganizedUsers] = useState(initialData);
    const [organizedUsers, setOrganizedUsers] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [draggedUser, setDraggedUser] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        const { active } = event;
        const activeUser = unorganizedUsers.find(user => user.id === active.id) ||
            organizedUsers.find(user => user.id === active.id);

        setActiveId(active.id);
        setDraggedUser(activeUser);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        setActiveId(null);
        setDraggedUser(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        console.log('Drag ended:', { activeId, overId });

        // מציאת המשתמש הנגרר
        const activeUser = unorganizedUsers.find(user => user.id === activeId) ||
            organizedUsers.find(user => user.id === activeId);

        if (!activeUser) return;

        // זיהוי מאיפה ולאן הגרירה
        const isActiveInUnorganized = unorganizedUsers.some(user => user.id === activeId);
        const isActiveInOrganized = organizedUsers.some(user => user.id === activeId);

        // זיהוי הקונטיינר של היעד
        let targetContainer = null;
        let insertIndex = -1;

        // בדיקה אם זה drop zone
        if (overId.toString().startsWith('dropzone-')) {
            const parts = overId.split('-');
            targetContainer = parts[1]; // organized או unorganized
            insertIndex = parseInt(parts[2]); // האינדקס
            console.log('Drop zone detected:', { targetContainer, insertIndex });
        }
        // בדיקה אם הגרירה היא ישירות לקונטיינר
        else if (overId === 'unorganized' || overId === 'organized') {
            targetContainer = overId;
            console.log('Container detected:', targetContainer);
        } else {
            // בדיקה לאיזה קונטיינר השתמש שגורר עליו שייך
            const isOverInUnorganized = unorganizedUsers.some(user => user.id === overId);
            const isOverInOrganized = organizedUsers.some(user => user.id === overId);

            if (isOverInUnorganized) {
                targetContainer = 'unorganized';
            } else if (isOverInOrganized) {
                targetContainer = 'organized';
                // אם גוררים על משתמש בעמודה המסודרת, נכניס לפניו
                const overIndex = organizedUsers.findIndex(user => user.id === overId);
                insertIndex = overIndex;
            }
            console.log('User detected:', { targetContainer, insertIndex });
        }

        if (!targetContainer || activeId === overId) return;

        // ביצוע הפעולות על פי הלוגיקה
        if (isActiveInUnorganized && targetContainer === 'organized') {
            console.log('Moving from unorganized to organized at index:', insertIndex);
            // העברה מרשימה לא מסודרת לרשימה מסודרת
            setUnorganizedUsers(prev => prev.filter(user => user.id !== activeId));

            if (insertIndex >= 0) {
                // הכנסה במקום ספציפי
                setOrganizedUsers(prev => {
                    const newArray = [...prev];
                    newArray.splice(insertIndex, 0, activeUser);
                    return newArray;
                });
            } else {
                // הוספה בסוף
                setOrganizedUsers(prev => [...prev, activeUser]);
            }
        }
        else if (isActiveInOrganized && targetContainer === 'unorganized') {
            console.log('Moving from organized to unorganized');
            // העברה מרשימה מסודרת לרשימה לא מסודרת (תמיד בסוף)
            setOrganizedUsers(prev => prev.filter(user => user.id !== activeId));
            setUnorganizedUsers(prev => [...prev, activeUser]);
        }
        else if (isActiveInOrganized && targetContainer === 'organized') {
            console.log('Reordering within organized at index:', insertIndex);
            // סידור מחדש בתוך הרשימה המסודרת
            const oldIndex = organizedUsers.findIndex(user => user.id === activeId);

            if (insertIndex >= 0 && insertIndex !== oldIndex) {
                // שימוש ב-drop zone או גרירה על משתמש
                setOrganizedUsers(prev => {
                    const newArray = prev.filter(user => user.id !== activeId);
                    // התאמת האינדקס אם גוררים למטה
                    const adjustedIndex = insertIndex > oldIndex ? insertIndex - 1 : insertIndex;
                    newArray.splice(adjustedIndex, 0, activeUser);
                    return newArray;
                });
            }
        }
    };

    const handleSaveOrder = async () => {
        try {
            // כאן תוכל לשלוח את הנתונים לשרת
            console.log('Saving order:', organizedUsers.map((user, index) => ({
                id: user.id,
                name: user.name,
                order: index + 1
            })));

            // הצגת הודעת הצלחה
            alert('הסדר נשמר בהצלחה!');
        } catch (error) {
            console.error('Error saving order:', error);
            alert('שגיאה בשמירת הסדר');
        }
    };

    // פונקציית collision detection מותאמת אישית
    const customCollisionDetection = (args) => {
        const { active, droppableContainers, pointerCoordinates } = args;

        if (!pointerCoordinates) {
            return closestCenter(args);
        }

        // קודם נחפש drop zones
        const dropZoneContainers = Array.from(droppableContainers).filter(container =>
            container.id.toString().startsWith('dropzone-')
        );

        // חישוב מרחקים לכל drop zone
        const dropZoneDistances = dropZoneContainers.map(container => {
            const rect = container.rect.current;
            if (!rect) return { container, distance: Infinity };

            const centerY = rect.top + rect.height / 2;
            const distance = Math.abs(pointerCoordinates.y - centerY);

            return { container, distance };
        }).filter(({ distance }) => distance !== Infinity);

        // אם יש drop zone קרוב מספיק (פחות מ-50 פיקסלים), נבחר אותו
        const nearestDropZone = dropZoneDistances
            .sort((a, b) => a.distance - b.distance)[0];

        if (nearestDropZone && nearestDropZone.distance < 50) {
            return [{ id: nearestDropZone.container.id }];
        }

        // אחרת, נבדוק containers רגילים
        const containerIntersections = pointerWithin(args);
        if (containerIntersections.length > 0) {
            return containerIntersections;
        }

        // במקרה האחרון, נחזור לזיהוי הסטנדרטי
        return closestCenter(args);
    };
    const handleMoveToOrganized = (user, position) => {
        const targetIndex = Math.min(Math.max(position - 1, 0), organizedUsers.length);

        setUnorganizedUsers(prev => prev.filter(u => u.id !== user.id));
        setOrganizedUsers(prev => {
            const newArray = [...prev];
            newArray.splice(targetIndex, 0, user);
            return newArray;
        });
    };

    // פונקציה לשינוי מיקום בעמודה המסודרת
    const handleMoveInOrganized = (user, position) => {
        const maxPosition = organizedUsers.length;
        if (position > maxPosition || position < 1) {
            alert(`המיקום חייב להיות בין 1 ל-${maxPosition}`);
            return;
        }

        const currentIndex = organizedUsers.findIndex(u => u.id === user.id);
        const targetIndex = position - 1;

        if (currentIndex !== targetIndex) {
            setOrganizedUsers(prev => {
                const newArray = [...prev];
                const [movedUser] = newArray.splice(currentIndex, 1);
                newArray.splice(targetIndex, 0, movedUser);
                return newArray;
            });
        }
    };

    return (
        <Card sx={{ width: 1, height: "85vh", overflow: 'hidden' }}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    קבוצות ליקוט
                </Typography>

                <DndContext
                    sensors={sensors}
                    collisionDetection={customCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <Grid container spacing={3}>
                        {/* עמודה ימין - משתמשים לא מסודרים (במצב RTL) */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2, height: '60vh', display: 'flex', flexDirection: 'column' }}>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Typography variant="h5" component="h2">
                                        משתמשים לא מסודרים
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
                                        {unorganizedUsers.map((user) => (
                                            <SortableUserItem
                                                key={user.id}
                                                user={user}
                                                showDragHandle={true}
                                                onMoveToOrganized={handleMoveToOrganized}
                                                isInOrganized={false}
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
                                            <Typography variant="body1">
                                                כל המשתמשים מסודרים
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
                                        קבוצת ליקוט מסודרת
                                    </Typography>
                                    <Chip
                                        label={organizedUsers.length}
                                        color="success"
                                        size="small"
                                    />
                                </Box>

                                <Box sx={{ flex: 1, overflow: 'auto', pr: 1 }}>
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
                                                            onMoveInOrganized={handleMoveInOrganized}
                                                            isInOrganized={true}
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
                                        )                                        )}
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
                                                גרור משתמשים לכאן כדי לסדר אותם
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

                {/* כפתור שמירה */}
                {organizedUsers.length > 0 && (
                    <Box display="flex" justifyContent="center" mt={3}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveOrder}
                            sx={{ px: 4, py: 1.5 }}
                        >
                            שמור סדר ({organizedUsers.length} משתמשים)
                        </Button>
                    </Box>
                )}
            </Box>
        </Card>
    );
}

export default CollectionGroups;