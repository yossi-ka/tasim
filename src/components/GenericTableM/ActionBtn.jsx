import React from 'react';


import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTheme } from '@mui/material/styles';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import CloseIcon from '@mui/icons-material/Close';


import { isFunction } from '../../utils/func';

const ActionBtn = ({ isDense, actions, row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse }) => {

    const theme = useTheme();

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    // const actionDisabled = (action) => {
    //     if (action.disabled) {
    //         if (typeof action.disabled === 'function') {
    //             if (action.disabled()) {
    //                 return true;
    //             } else {
    //                 return false;
    //             }
    //         }
    //     }
    //     return action.disabled;
    // }

    if (openCollapse) {
        return (<Tooltip title="סגור">
            <IconButton
                size="small"
                sx={{ ml: 2 }}
                color='error'
                onClick={() => setOpenCollapse(false)}><CloseIcon fontSize='small' /></IconButton>
        </Tooltip>)

    }
    return (
        <React.Fragment>

            <Tooltip title={actions.length > 1 ? "פעולות ברשומה" : actions[0].label}>
                <IconButton
                    onClick={(e) => {
                        if (actions.length > 1) {
                            handleClick(e);
                        } else {
                            actions[0].onClick(row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse);
                        }
                    }}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    disabled={actions.length > 1 ? false : isFunction(actions[0].disabled) ? actions[0].disabled(row) : actions[0].disabled}
                >
                    {(actions.length > 1 || (actions.length === 1 && !actions[0].icon))
                        ? <MoreVertIcon sx={{ fontSize: 18 }} />
                        : actions[0].icon}
                </IconButton>
            </Tooltip>

            {actions.length > 1 && <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                    elevation: 0,
                    sx: {
                        p: 1,
                        pr: 4,
                        overflow: 'visible',
                        // filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                        boxShadow: theme.customShadows.z4,
                        borderRadius: 3,
                        mt: -1,
                        mr: 5,
                        '& .MuiAvatar-root': {
                            width: 32,
                            height: 32,
                            ml: -0.5,
                            mr: 1,
                        },
                        '&:before': {
                            content: '""',
                            display: 'block',
                            position: 'absolute',
                            top: 25,
                            right: -5,
                            width: 10,
                            height: 10,
                            bgcolor: 'background.paper',
                            transform: 'translateY(-50%) rotate(45deg)',
                            zIndex: 0,
                        },
                    },
                }}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
            >

                {actions.map((action, index) => (action.hide && action.hide(row)) ? null : action.hr
                    ? <Divider key={index} />
                    : <MenuItem disabled={isFunction(action.disabled) ? action.disabled(row) : action.disabled}
                        key={index}
                        onClick={() => action.onClick(row, setOpenCollapse, openCollapse, index, objCollapse, setObjCollapse)}>
                        <ListItemIcon>
                            {action.icon
                                ? action.icon
                                : <DonutSmallIcon fontSize="small" color={action.color ? action.color : "primary"} />}
                        </ListItemIcon>
                        <Typography variant="subtitle2" color={action.color ? action.color : "primary"} noWrap>
                            {action.label}
                        </Typography>
                    </MenuItem>)}

            </Menu>}
        </React.Fragment>
    );
}

export default ActionBtn;