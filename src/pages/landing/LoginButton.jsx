import React from 'react';
import { Button, Tooltip } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import Context from '../../context';
import LoginContent from './LoginContent.jsx';

const LoginButton = () => {
    const { popup } = React.useContext(Context);

    const handleLoginClick = () => {
        console.log(123);
        
        popup({
            title: 'התחברות',
            content: <LoginContent />,
            size: 'xs'
        });
    };

    return (
        <Tooltip title="התחברות" arrow placement="bottom">
            <Button
                onClick={handleLoginClick}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    padding: 0,
                    background: 'transparent',
                    color: 'rgba(255, 255, 255, 0.8)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                        color: 'white',
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                        background: 'rgba(255, 255, 255, 0.1)',
                        transform: 'scale(1.1)',
                    }
                }}
            >
                <PersonOutlineIcon sx={{ fontSize: 24 }} />
            </Button>
        </Tooltip>
    );
};

export default LoginButton;