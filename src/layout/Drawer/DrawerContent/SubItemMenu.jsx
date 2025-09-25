import React from 'react'
import { useNavigate } from 'react-router-dom';


import { MenuItem, ListItemText, ListItemIcon, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';


const SubItemMenu = ({ title, path, active, setActive, isSubItem, icon, setSelectedIndex, selectedIndex, disabled }) => {
    const navigate = useNavigate();

    const handleClick = (path) => {
        if (!isSubItem) {
            setSelectedIndex(selectedIndex);
        }
        setActive(path);
        navigate(path);
    }

    return (
        <MenuItem
            onClick={() => handleClick(path)}
            sx={{
                ...(active === path && {
                    bgcolor: "primary.main",
                    color: "white",
                    '& svg': { color: "white" }
                })
            }}
            disabled={disabled}
        >
            {isSubItem ? <ListItemIcon sx={{ ml: 2.5 }}>
                <CircleIcon sx={{ fontSize: 10 }} />
            </ListItemIcon> : <ListItemIcon>
                {icon}
            </ListItemIcon>}

            {isSubItem ? <ListItemText primaryTypographyProps={{ variant: "body2" }} sx={{ ml: -2.5 }}>
                {title}
            </ListItemText> :
                <ListItemText>
                    <Typography variant="subtitle2" color={active === path ? 'white' : 'primary.main'}>
                        {title}
                    </Typography>
                </ListItemText>}
        </MenuItem >
    )
}

export default SubItemMenu;

SubItemMenu.defultProps = {
    isSubItem: false,
    selectedIndex: 0,
    setSelectedIndex: null,
    disabled: false
}