// material-ui
import { alpha } from '@mui/material/styles';

// ==============================|| OVERRIDES - OUTLINED INPUT ||============================== //

export default function FilledInput(theme) {
    return {
        MuiFilledInput: {
            styleOverrides: {
                input: {
                    '&.Mui-disabled': {
                        color: theme.palette.grey[900],
                    },
                },
                underline: {
                    "&:before": {
                        borderBottom: `0px solid ${theme.palette.grey[300]}`,
                    },
                    "&:after": {
                        borderBottom: `0px solid ${theme.palette.primary.light}`,
                    },
                    "&:hover:not(.Mui-disabled):before": {
                        borderBottom: `0px solid ${theme.palette.primary.light}`,
                    },
                    "&.Mui-disabled:before": {
                        borderBottom: `0px solid ${theme.palette.grey[300]}`,
                    },

                },

                disabled: {
                    "&.MuiFilledInput-root": {
                        color: theme.palette.grey[900],
                    },
                },
                root: {
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    fontSize: '105%',
                    '&.Mui-disabled': {
                        backgroundColor: theme.palette.grey[100],
                        color: "#fff",
                    },
                }
            }
        }
    };
}
