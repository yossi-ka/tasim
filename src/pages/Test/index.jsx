import React from 'react';
import { Button } from '@mui/material';
import { updateCustomerIndex, moveAllOrdersFrom4To5, updateCollectionGroupProducts, } from '../../api/services/collectionGroups';
import { trimStreetNamesInRouteOrders } from '../../api/services/routeOrders';
import { fixProductPlaces, getLastOrdersByUpdate, getOpenCollectionGroups, getProductWithQuantityForShipping, getTextPlace, updateCollectionGroups, updateProductSku } from '../../api/services/test';
import { read, utils } from 'xlsx';

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

            {/* <Button
                variant='contained'
                onClick={trimStreetNamesInRouteOrders}
            >תיקון שמות רחובות בהזמנות מסלול</Button> */}
            {/* <Button
                variant='contained'
                onClick={async () => {
                    const x = await getLastOrdersByUpdate();
                    console.log("Last updated orders:", x);
                }}
            >הזמנות אחרונות</Button> */}
            {/* <Button
                variant='contained'
                onClick={async () => {
                    const x = await getProductWithQuantityForShipping();
                    console.log("Products with quantity for shipping:", x);
                }}
            >מוצרים עם כמות למשלוח</Button> */}
            {/* <Button
                variant='contained'
                onClick={async () => {
                    const x = await getOpenCollectionGroups();
                    console.log("Open collection groups:", x);
                }}
            >קבוצות אספקה פתוחות</Button> */}
            {/* <Button
                variant='contained'
                onClick={async () => {
                    const x = await updateCollectionGroups();
                    console.log("Updated collection groups:", x);
                }}
            >עדכון קבוצות אספקה</Button> */}
            <Button
                variant='contained'
                onClick={async () => {
                    const x = await fixProductPlaces();
                    console.log("Text place:", x);
                }}
            >תיקון מיקומים לא תקינים</Button>
            <Button
                variant='contained'
                onClick={async () => {
                    //get a excel or csv file and read it with sheetjs
                    //create input element
                    const element = document.createElement("input");
                    element.type = "file";
                    element.accept = ".xlsx, .xls, .csv";
                    element.onchange = async (event) => {
                        const file = event.target.files[0];
                        if (file) {
                            const data = await file.arrayBuffer();
                            const workbook = read(data);

                            //set key names:
                            const keys = [
                                "_placeName",
                                "phoneCode",//string
                                "_productName1",
                                "_productName2",
                                "quantity",
                                "manufacturer",
                                "hashgacha",
                                "sku"
                            ]

                            // שימוש במפתחות שלנו כ-headers מותאמים אישית
                            const jsonData = utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
                                header: keys,
                                range: 1 // מתחיל משורה 2 (מדלג על הכותרות המקוריות)
                            });

                            await updateProductSku(jsonData);

                            //   console.log("Excel data:", jsonData);
                        }
                    };
                    element.click();
                }}
            >עדכון מקטים</Button>
        </div>
    );
}

export default Test;