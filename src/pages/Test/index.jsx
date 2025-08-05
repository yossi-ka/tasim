import React from 'react';
import { Button } from '@mui/material';
import { updateCustomerIndex, moveAllOrdersFrom4To5, updateCollectionGroupProducts, } from '../../api/services/collectionGroups';
import { trimStreetNamesInRouteOrders } from '../../api/services/routeOrders';

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

    const amountInOrder = async () => {
        // updateCustomerIndex()
        //     .then((res) => {
        //         console.log("Amount in orders:", res);
        //     });
    }

    return (
        <div>

            {/* <Button
                variant='contained'
                onClick={updateOrdersStatus}
            >העברת הזמנות בקבוצה לסטטוס 1</Button> */}
            {/* <Button
                variant='contained'
                onClick={amountInOrder}
            >בדיקת כמויות להזמנות</Button> */}
            {/* <Button
                variant='contained'
                onClick={async () => fixGroup()}
            >תיקון קבוצה לא תקינה</Button> */}

            <Button
                variant='contained'
                onClick={trimStreetNamesInRouteOrders}
            >תיקון שמות רחובות בהזמנות מסלול</Button>
        </div>
    );
}

export default Test;