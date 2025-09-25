// material-ui
import { alpha } from '@mui/material/styles';

// ==================================|| DEFAULT THEME - CUSTOM SHADOWS  ||================================== //

const CustomShadows = (theme) => ({
    button: `0 2px #0000000b`,
    text: `0 -1px 0 rgb(0 0 0 / 12%)`,
    z1: `0px 2px 8px ${alpha(theme.palette.grey[900], 0.15)}`,
    z2: `rgb(145 158 171 / 20%) 0px 0px 2px 0px, rgb(145 158 171 / 12%) 0px 12px 24px -4px;`,
    z3: `${alpha(theme.palette.grey[900], 0.15)} 0px 0px 2px 0px, ${alpha(theme.palette.grey[900], 0.15)} 0px 12px 24px -4px;`,
    z4: `rgb(145 158 171 / 24%) 0px 0px 2px 0px, rgb(145 158 171 / 24%) 20px 12px 20px -4px;`,
    // only available in paid version
});

export default CustomShadows;
