import React from 'react'

// material-ui
import {
    Typography,
} from '@mui/material';

const BooleanColView = ({ value }) => {

    const renderSwitch = (value) => {

        const v = <Typography variant="body2" color="success.main">✓</Typography>;
        const x = <Typography variant="body2" color="error">✗</Typography>;
        const none = <Typography variant="body2" color="error">-</Typography>;

        switch (value) {
            case true:
                return v;
            case false:
                return x;
            case 'true':
                return v;
            case 'false':
                return x;
            case 'כן':
                return v;
            case 'לא':
                return x;
            case '1':
                return v;
            case '0':
                return x;
            case 1:
                return v;
            case 0:
                return x;
            default:
                return none;
        }
    }

    return renderSwitch(value);
}

export default BooleanColView;