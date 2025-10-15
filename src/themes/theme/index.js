// ==============================|| PRESET THEME - THEME SELECTOR ||============================== //

const Theme = (colors) => {
    const { blue, red, gold, cyan, green, grey, orange } = colors;

    const tasim = {
        0: '#d9e8f7',
        1: '#b3d1ef',
        2: '#8db9e7',
        3: '#67a2df',
        4: '#4b8cd7',
        5: '#2e76cf',
        6: '#1f5fb8',
        7: '#1048a1',
        8: '#0d3b8a',
        9: '#0a2e73',
    }

    const greyColors = {
        0: grey[0],
        50: grey[1],
        100: grey[2],
        200: grey[3],
        300: grey[4],
        400: grey[5],
        500: grey[6],
        600: grey[7],
        700: grey[8],
        800: grey[9],
        900: grey[10],
        A50: grey[15],
        A100: grey[11],
        A200: grey[12],
        A400: grey[13],
        A700: grey[14],
        A800: grey[16]
    };
    const contrastText = '#fff';

    return {
        primary: {
            lighter: tasim[0],
            100: tasim[1],
            200: tasim[2],
            light: tasim[3],
            400: tasim[4],
            main: tasim[5],
            dark: tasim[6],
            700: tasim[7],
            darker: tasim[8],
            900: tasim[9],
            contrastText
        },
        secondary: {
            lighter: greyColors[50],
            100: greyColors[100],
            200: greyColors[200],
            light: greyColors[300],
            400: greyColors[400],
            main: greyColors[500],
            600: greyColors[600],
            dark: greyColors[700],
            800: greyColors[800],
            darker: greyColors[900],
            A100: greyColors[0],
            A200: greyColors.A400,
            A300: greyColors.A700,
            contrastText: greyColors[0]
        },
        error: {
            lighter: red[0],
            100: red[1],
            200: red[2],
            light: red[3],
            400: red[4],
            main: red[5],
            dark: red[6],
            700: red[7],
            darker: red[8],
            900: red[9],
            contrastText
        },
        warning: {
            lighter: gold[0],
            100: gold[1],
            200: gold[2],
            light: gold[3],
            400: gold[4],
            main: gold[5],
            dark: gold[6],
            700: gold[7],
            darker: gold[8],
            900: gold[9],
            contrastText: greyColors[100]
        },
        info: {
            lighter: cyan[0],
            100: cyan[1],
            200: cyan[2],
            light: cyan[3],
            400: cyan[4],
            main: cyan[5],
            dark: cyan[6],
            700: cyan[7],
            darker: cyan[8],
            900: cyan[9],
            contrastText
        },
        success: {
            lighter: green[0],
            100: green[1],
            200: green[2],
            light: green[3],
            400: green[4],
            main: green[5],
            dark: green[6],
            700: green[7],
            darker: green[8],
            900: green[9],
            contrastText
        },
        grey: greyColors
    };
};

export default Theme;
