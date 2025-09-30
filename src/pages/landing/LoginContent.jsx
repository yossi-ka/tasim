import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
import Context from '../../context';

const LoginContent = () => {
    
    const theme = useTheme();
    const navigate = useNavigate();
    const { restartUser, closePopup, snackbar } = React.useContext(Context);

    const login = () => {
        const provider = new GoogleAuthProvider();
        const auth = getAuth();
        return signInWithPopup(auth, provider);
    };

    const handleGoogleLogin = () => {
        login()
            .then((user) => {
                restartUser(user.user);
                closePopup();
                navigate('/');
            })
            .catch((error) => {
                console.error('Login error:', error);
                snackbar('משתמש לא מורשה. לפרטים צור קשר עם מנהל האתר', 'error');
            });
    };

    return (
        <Box sx={{ textAlign: 'center', p: 1 }}>
            {/* Header */}
            <Typography
                variant="h6"
                sx={{
                    textAlign: 'center',
                    mb: 3,
                    color: theme.palette.primary.dark,
                    fontWeight: 600
                }}
            >
                התחברות
            </Typography>

            {/* Google Login Button */}
            <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                startIcon={<GoogleIcon />}
                sx={{
                    py: 1.5,
                    borderRadius: '12px',
                    borderColor: '#dadce0',
                    color: '#3c4043',
                    textTransform: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    '&:hover': {
                        backgroundColor: '#f8f9fa',
                        borderColor: '#dadce0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    },
                    '& .MuiSvgIcon-root': {
                        fontSize: 20
                    }
                }}
            >
                התחבר באמצעות Google
            </Button>

            {/* Footer text */}
            <Typography
                variant="caption"
                sx={{
                    display: 'block',
                    textAlign: 'center',
                    mt: 2,
                    color: '#666',
                    fontSize: '12px'
                }}
            >
                התחברות מהירה ובטוחה
            </Typography>
        </Box>
    );
};

export default LoginContent;