import React from "react";
import { Stack, Typography } from "@mui/material";
import LoadingData from "../../../components/LoadingData";

const LoadingCloseCollection = ({ closeCollection, isLoading }) => {

    return <Stack direction="column"
        alignItems="center"
        spacing={4}
        justifyContent="center"
        sx={{ width: 1, height: 1 }}>
        <LoadingData />.

        <Typography variant={"h2"} component='p' sx={{ color: "secondary.main" }}>
            הקבוצה נסגרת ומתבצע חישוב של כמויות המוצרים
        </Typography>
        <Typography variant={"h4"} component='p' sx={{ color: "secondary.main" }}>
            אין לסגור את המסך עד לסיום
        </Typography>
        <Typography variant={"h4"} component='p' sx={{ color: "secondary.main" }}>
            בהצלחה ;)
        </Typography>
    </Stack>

}

export default LoadingCloseCollection;