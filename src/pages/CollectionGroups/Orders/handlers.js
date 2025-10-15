import {
    closestCenter,
    pointerWithin,
} from "@dnd-kit/core";

// פונקציית collision detection מותאמת אישית
export const customCollisionDetection = (args) => {
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

// פונקציה לטיפול בתחילת הגרירה
export const handleDragStart = (event, unorganizedUsers, organizedUsers, setActiveId, setDraggedUser) => {
    const { active } = event;
    const activeUser = unorganizedUsers.find(user => user.id === active.id) ||
        organizedUsers.find(user => user.id === active.id);

    setActiveId(active.id);
    setDraggedUser(activeUser);
};

// פונקציה לטיפול בסיום הגרירה
export const handleDragEnd = (event, unorganizedUsers, organizedUsers, setUnorganizedUsers, setOrganizedUsers, setActiveId, setDraggedUser) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedUser(null);

    if (!over) return false; // לא היה שינוי

    const activeId = active.id;
    const overId = over.id;

    // מציאת המשתמש הנגרר
    const activeUser = unorganizedUsers.find(user => user.id === activeId) ||
        organizedUsers.find(user => user.id === activeId);

    if (!activeUser) return false; // לא היה שינוי

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
    }
    // בדיקה אם הגרירה היא ישירות לקונטיינר
    else if (overId === 'unorganized' || overId === 'organized') {
        targetContainer = overId;
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
    }

    if (!targetContainer || activeId === overId) return false; // לא היה שינוי

    let hasChange = false; // משתנה לעקוב אחרי שינויים

    // ביצוע הפעולות על פי הלוגיקה
    if (isActiveInUnorganized && targetContainer === 'organized') {
        // העברה מרשימה לא מסודרת לרשימה מסודרת
        setUnorganizedUsers(prev => prev.filter(user => user.id !== activeId));
        hasChange = true;

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
        hasChange = true;
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
            hasChange = true;
        }
    }
    
    return hasChange; // החזרת האם היה שינוי
};

// פונקציה להעברת משתמש לעמודה מסודרת
export const handleMoveToOrganized = (user, position, organizedUsers, setUnorganizedUsers, setOrganizedUsers) => {
    const targetIndex = Math.min(Math.max(position - 1, 0), organizedUsers.length);

    setUnorganizedUsers(prev => prev.filter(u => u.id !== user.id));
    setOrganizedUsers(prev => {
        const newArray = [...prev];
        newArray.splice(targetIndex, 0, user);
        return newArray;
    });
};

// פונקציה לשינוי מיקום בעמודה המסודרת
export const handleMoveInOrganized = (user, position, organizedUsers, setOrganizedUsers) => {
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

// פונקציה לשמירת הסדר
export const handleSaveOrder = async (organizedUsers) => {
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
