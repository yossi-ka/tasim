import React from 'react';


import { Divider, IconButton, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloseIcon from '@mui/icons-material/Close';
import ListItemIcon from '@mui/material/ListItemIcon';
import DonutSmallIcon from '@mui/icons-material/DonutSmall';
import { useTheme } from '@mui/material/styles';

import { isFunction } from '../../utils/func';

const ActionBtn = ({ isDense, actionsArr, row, setOpenCollapse, openCollapse }) => {

    const actions = React.useMemo(() => actionsArr.filter(action => action), [actionsArr]);
    const theme = useTheme();

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };


    return (
        <React.Fragment>

            <Tooltip title={openCollapse ? "סגור" : actions.length > 1 ? "פעולות ברשומה" : actions[0].label}>
                <IconButton
                    disabled={actions.length > 1 ? false : isFunction(actions[0].disabled) ? actions[0].disabled({ row }) : actions[0].disabled}
                    onClick={(e) => {
                        if (openCollapse) return setOpenCollapse(false);
                        if (actions.length > 1) {
                            handleClick(e);
                        } else {
                            actions[0].onClick({ row, setOpenCollapse, openCollapse });
                        }
                    }}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                >
                    {openCollapse ? <CloseIcon color='error' /> : (actions.length > 1 || (actions.length === 1 && !actions[0].icon))
                        ? <MoreVertIcon fontSize={isDense ? "small" : "medium"} />
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

                {actions.map((action, index) => action.hr
                    ? <Divider key={index} />
                    : <MenuItem
                        key={index}
                        disabled={isFunction(action.disabled) ? action.disabled({ row }) : action.disabled}
                        onClick={() => action.onClick({ row, setOpenCollapse, openCollapse })}
                    >
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