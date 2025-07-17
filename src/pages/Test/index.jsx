import React from 'react';
import { Button } from '@mui/material';
import { moveAllOrdersFrom4To5, updateCollectionGroupProducts } from '../../api/services/collectionGroups';

const Test = () => {

    const updateOrdersStatus = async () => {
        try {
            const c = window.confirm("האם אתה בטוח שאתה רוצה להעביר את כל ההזמנות מסטטוס 4 לסטטוס 5?\nאין אפשרות לבט ל את הפעולה הזו");
            if (!c) return;
            // const amount = await moveAllOrdersFrom4To5();
            const amount = await moveAllOrdersFrom4To5();
            if (amount > 0) {
                alert(`ההזמנות הועברו בהצלחה, סה"כ ${amount} הזמנות`);
            } else {
                alert("לא נמצאו הזמנות להעברה");
            }
        } catch (error) {
            console.error("Error moving orders:", error);
            alert("שגיאה בהעברת ההזמנות, אנא נסה שוב מאוחר יותר");
        }
    }

    return (
        <div>

            {/* <Button
                variant='contained'
                onClick={updateOrdersStatus}
            >העברת הזמנות בקבוצה לסטטוס 1</Button> */}
        </div>
    );
}

export default Test;