// material-ui
import { useTheme } from '@mui/material/styles';
import { AppBar, IconButton, Toolbar, useMediaQuery, Box, Stack, Typography, Tooltip, Button } from '@mui/material';

// project import
import AppBarStyled from './AppBarStyled';

// assets
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
// import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

// ==============================|| MAIN LAYOUT - HEADER ||============================== //

const Header = ({ open, handleDrawerToggle }) => {
    const theme = useTheme();
    const matchDownMD = useMediaQuery(theme.breakpoints.down('lg'));

    const iconBackColor = 'grey.100';
    const iconBackColorOpen = 'grey.200';

    // common header
    const mainHeader = (
        <Toolbar>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                sx={{ width: 1, height: 1 }}
            >
                <IconButton

                    disableRipple
                    aria-label="open drawer"
                    onClick={handleDrawerToggle}
                    edge="start"
                    color="primary"
                    sx={{ color: 'text.primary', bgcolor: open ? iconBackColorOpen : iconBackColor, ml: { xs: 0, lg: -2 } }}
                >
                    {!open ? <MenuOpenIcon /> : <MenuIcon />}
                </IconButton>
                <Box sx={{ height: 1 }}>
                    <Typography variant="h4" component="div" sx={{ color: 'text.primary' }}>מערכת ניהול</Typography>

                    {/* <img src="/logo.jpg" alt="logo" style={{ height: "45px", display: "block", margin: "auto" }} /> */}
                </Box>
            </Stack>
        </Toolbar>
    );

    // app-bar params
    const appBar = {
        position: 'fixed',
        color: 'inherit',
        elevation: 0,
        sx: {
            borderBottom: `1px solid ${theme.palette.divider}`
            // boxShadow: theme.customShadows.z1
        }
    };

    return (
        <>
            {!matchDownMD ? (
                <AppBarStyled open={open} {...appBar}>
                    {mainHeader}
                </AppBarStyled>
            ) : (
                <AppBar {...appBar}>{mainHeader}</AppBar>
            )}
        </>
    );
};

export default Header;
