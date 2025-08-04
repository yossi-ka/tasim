import React from 'react';

// material-ui
import { Box, MenuList, MenuItem, ListItemText, ListItemIcon, Collapse, Typography } from '@mui/material';

import GroupsIcon from '@mui/icons-material/Groups';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PermPhoneMsgIcon from '@mui/icons-material/PermPhoneMsg';
import EngineeringIcon from '@mui/icons-material/Engineering';
import InventoryIcon from '@mui/icons-material/Inventory';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RouteIcon from '@mui/icons-material/Route';

// project imports
import SubItemMenu from './SubItemMenu';
import Context from '../../../context';


const DrawerContent = () => {

    const permission = "admin"// user?.permission
    const admin = [
        { title: "הזמנות", to: "orders", icon: <ShoppingCartIcon color='primary' /> },
        {
            title: "קבוצות ליקוט",
            to: "collectionGroups",
            icon: <ShoppingBagIcon color='primary' />,
            items: [
                { title: "קבוצה פעילה", to: "collection-groups" },
                { title: "היסטוריה", to: "collection-groups-history" }
            ]
        },
        { title: "הודעות קוליות", to: "voice-msg", icon: <PermPhoneMsgIcon color='primary' /> },
        { title: "לקוחות", to: "customers", icon: <GroupsIcon color='primary' /> },
        { title: "מוצרים", to: "products", icon: <InventoryIcon color='primary' /> },
        { title: "סדר מסלולים", to: "route-orders", icon: <RouteIcon color='primary' /> },
        { title: "עובדים", to: "employees", icon: <EngineeringIcon color='primary' /> },

    ]


    const menuItemsJ = React.useMemo(() => {
        if (permission === "admin") return admin
        return []
    }, [permission])

    const [active, setActive] = React.useState(null);

    //open array for the collapse menu
    const [selectedIndex, setSelectedIndex] = React.useState("")

    const ChooseItem = index => {
        if (selectedIndex === index) {
            setSelectedIndex("")
        } else {
            setSelectedIndex(index)
        }
    }

    const menuItems = menuItemsJ.map((menuItem, index) => {
        if (menuItem.items) {
            return <Box key={"f" + index}>
                <MenuItem
                    onClick={() => {
                        ChooseItem(index)
                    }}
                    sx={{
                        bgcolor: index === selectedIndex ? "primary.lighter" : null,
                        color: index === selectedIndex ? "white" : null
                    }}
                    disabled={menuItem.disabled}
                >
                    <ListItemIcon>
                        {menuItem.icon}
                    </ListItemIcon>
                    <ListItemText>
                        <Typography variant="subtitle2" color="primary">
                            {menuItem.title}
                            <span>&nbsp;{index === selectedIndex ? <span>&#9652;</span> : <span>&#9662;</span>}</span>
                        </Typography>
                    </ListItemText>

                </MenuItem>
                <Collapse in={index === selectedIndex} timeout="auto" unmountOnExit sx={{ bgcolor: "primary.lighter" }} >
                    {menuItem.items.map((subItem, subIndex) => {
                        return (
                            <MenuList component="div" disablePadding key={subIndex}>
                                <SubItemMenu title={subItem.title} path={subItem.to} active={active} setActive={setActive} isSubItem disabled={subItem.disabled} />
                            </MenuList>
                        )
                    })}
                </Collapse>
            </Box>
        }
        else {
            return <SubItemMenu key={"f" + index} title={menuItem.title}
                path={menuItem.to} active={active}
                setActive={setActive}
                icon={menuItem.icon}
                setSelectedIndex={setSelectedIndex}
                selectedIndex={index}
                disabled={menuItem.disabled} />
        }
    })

    return (
        <Box sx={{ width: 1 }}>
            <MenuList>
                {menuItems}
            </MenuList>
        </Box>
    )
}

export default DrawerContent;
