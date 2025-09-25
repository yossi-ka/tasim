import React from "react";

import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/sdk";

import { Box, CircularProgress, List, ListItemButton } from "@mui/material";

const CheckNumber = ({ closePopover, handleChange, name }) => {
    const [number, setNumber] = React.useState(null);
    const getData = () => {
        const q = query(collection(db, "tmichot"), orderBy("shekNomber", "desc"), limit(1));
        getDocs(q).then((docs) => {
            const num = docs.docs.length === 0 ? 1 : docs.docs[0].data().shekNomber;
            setNumber(num);
        });
    };
    React.useEffect(() => {
        getData();
    }, []);
    if (!number) return null// <Box sx={{width:'100px',display:'flex', alignContent:'center'}}> <CircularProgress color="primary" /></Box>;
    return (
        <List>
            {[1, 2, 3, 4, 5].map((item) => <ListItemButton key={item} button onClick={() => {
                handleChange(name, item + number)
                closePopover()
            }}>
                {item + number}
            </ListItemButton>
            )}
        </List>
    )
}
export default CheckNumber;