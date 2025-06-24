// ==============================|| PRESET THEME - THEME SELECTOR ||============================== //

const Theme = (colors) => {
    const { blue, red, gold, cyan, green, grey, orange } = colors;

    const ktzdaka = {
        0: '#f2e0d4',
        1: '#e6c6b7',
        2: '#dbaca1',
        3: '#cf938a',
        4: '#c47a74',
        5: '#b8615e',
        6: '#ac4849',
        7: '#a02f33',
        8: '#94161e',
        9: '#890d08',
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
            lighter: ktzdaka[0],
            100: ktzdaka[1],
            200: ktzdaka[2],
            light: ktzdaka[3],
            400: ktzdaka[4],
            main: ktzdaka[5],
            dark: ktzdaka[6],
            700: ktzdaka[7],
            darker: ktzdaka[8],
            900: ktzdaka[9],
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
