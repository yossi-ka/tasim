// ==================================|| PRESET THEME - THEME SELECTOR ||================================== //

const Theme = (colors) => {
    const { blue, red, gold, cyan, green, grey, orange } = colors;

    const blueTheme = {
        0: '#e3f2fd',  // כחול בהיר מאוד
        1: '#bbdefb',  // כחול בהיר 
        2: '#90caf9',  // כחול בינוני בהיר
        3: '#64b5f6',  // כחול בינוני
        4: '#42a5f5',  // כחול
        5: '#2196f3',  // כחול עיקרי (מטריאל דיזיין)
        6: '#1e88e5',  // כחול כהה
        7: '#1976d2',  // כחול כהה יותר
        8: '#1565c0',  // כחול כהה מאוד
        9: '#0d47a1',  // כחול עמוק
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
            lighter: blueTheme[0],
            100: blueTheme[1],
            200: blueTheme[2],
            light: blueTheme[3],
            400: blueTheme[4],
            main: blueTheme[5],
            dark: blueTheme[6],
            700: blueTheme[7],
            darker: blueTheme[8],
            900: blueTheme[9],
            contrastText
        },
        secondary: {
            lighter: '#f8faff',  // אפור-כחול בהיר מאוד
            100: '#ecf2ff',      // אפור-כחול בהיר
            200: '#d1dcf0',      // אפור-כחול
            light: '#b0bec5',    // אפור-כחול בינוני
            400: '#90a4ae',      // אפור-כחול
            main: '#78909c',     // אפור-כחול עיקרי
            600: '#546e7a',      // אפור-כחול כהה
            dark: '#37474f',     // אפור-כחול כהה יותר
            800: '#263238',      // אפור-כחול כהה מאוד
            darker: '#1c1f21',   // אפור כהה
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
            lighter: '#e1f5fe',  // תכלת בהיר מאוד
            100: '#b3e5fc',      // תכלת בהיר
            200: '#81d4fa',      // תכלת בהיר בינוני
            light: '#4fc3f7',    // תכלת בינוני
            400: '#29b6f6',      // תכלת
            main: '#03a9f4',     // תכלת עיקרי
            dark: '#0288d1',     // תכלת כהה
            700: '#0277bd',      // תכלת כהה יותר
            darker: '#01579b',   // תכלת כהה מאוד
            900: '#004d7a',      // תכלת עמוק
            contrastText
        },
        success: {
            lighter: '#e8f5e8',  // ירוק-כחול בהיר מאוד
            100: '#c8e6c9',      // ירוק-כחול בהיר
            200: '#a5d6a7',      // ירוק-כחול בהיר בינוני
            light: '#81c784',    // ירוק-כחול בינוני
            400: '#66bb6a',      // ירוק-כחול
            main: '#4caf50',     // ירוק עיקרי
            dark: '#388e3c',     // ירוק כהה
            700: '#2e7d32',      // ירוק כהה יותר
            darker: '#1b5e20',   // ירוק כהה מאוד
            900: '#0d4f0d',      // ירוק עמוק
            contrastText
        },
        grey: greyColors
    };
};

export default Theme;
