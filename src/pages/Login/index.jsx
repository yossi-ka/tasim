import React from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Grid, Paper, Snackbar, Stack, Typography } from "@mui/material";

import { GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";

import GoogleIcon from '@mui/icons-material/Google';
import { collection, doc, getDocs, query, updateDoc } from "firebase/firestore";
import { db, functions } from "../../firebase-config";
import { httpsCallable } from "firebase/functions";
import Context from "../../context";

const Login = () => {

    const { restartUser } = React.useContext(Context)
    const [error, setError] = React.useState(null);

    const nav = useNavigate();


    const login = () => {
        const provider = new GoogleAuthProvider();
        const auth = getAuth();
        return signInWithPopup(auth, provider)//.then((result) => result)
    }

    React.useEffect(() => {
        const auth = getAuth();
        auth.signOut().then(() => {
            console.log("User signed out successfully");
        }).catch((error) => {
            console.log("Error signing out user:", error);
        });
    }, [])



    return <Grid container component="main" sx={{
        height: "100vh",
        backgroundImage: `url(/bgLogin.jpg)`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        display: "flex",
        alignItems: "center",
        justifyContent: "end",
    }} >
        <Grid
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-around",
                height: "100vh",
                width: "50vh",
                px: 4,

            }}
            item
            component={Paper}
            elevation={20}
            square

        >
            <Stack spacing={2} direction="column" alignItems="center" justifyContent="center" sx={{ pt: 10 }}>
                <Typography component="h1" variant="h3" color="primary.dark">
                    כניסה למערכת
                </Typography>
                <Typography component="h1" variant="h3" color="primary.dark">טסים</Typography>
            </Stack>
            <Button
                size="large"
                onClick={() => login()
                    .then((user) => {
                        restartUser(user.user)
                        nav('/')
                    })
                    .catch((error) => {
                        setError(true)
                    })
                }
                variant="contained"
                startIcon={<GoogleIcon />}>
                כניסה עם חשבון גוגל
            </Button>



        </Grid>
        <Snackbar
            open={error}
            autoHideDuration={10000}
            onClose={() => setError(null)}
        >
            <Alert
                onClose={() => setError(null)}
                severity='error'
                variant="filled"
                sx={{ width: '100%' }}
            >
                <Typography variant="h4">משתמש לא מורשה</Typography>
                <Typography variant="caption">לפרטים צור קשר עם מנהל האתר</Typography>
            </Alert>
        </Snackbar>
    </Grid>
};

export default Login;
