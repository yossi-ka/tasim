import React from 'react';

import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import Context from '../../context';

const PdfViewer = () => {

    const { snackbar } = React.useContext(Context);

    const [file, setFile] = React.useState(false);

    // השימוש ברף ולא בסטייט רגיל הוא כדי למנוע רינדור של הקומפוננטה
    // זו הדרך היחידה שמצאתי

    const inputRef = React.useRef(null);
    const fileRef = React.useRef(null);
    const iframeRef = React.useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files[0].type === 'application/pdf') {
            fileRef.current = e.target.files[0];
            setFile(true);
        } else {
            snackbar("ניתן לטעון קבצי PDF בלבד.", 'error');
        }
    }

    React.useEffect(() => {
        if (file) {
            iframeRef.current.src = URL.createObjectURL(fileRef.current);
        }
    }, [file]);

    return (
        <Box sx={{ width: 1, height: 1 }}>
            <input
                style={{ display: 'none' }}
                ref={inputRef}
                type="file"
                onChange={handleFileChange}
            />
            <Stack direction="row" spacing={2} justifyContent="end" sx={{ width: 1 }}>
                <Button
                    variant="contained"
                    onClick={() => {
                        setFile(false);
                        fileRef.current = null;
                        inputRef.current.click()
                    }}
                    startIcon={<PictureAsPdfIcon />}
                >
                    טעינת קובץ
                </Button>
            </Stack>
            <Divider sx={{ my: 2 }} />
            {file && <iframe
                ref={iframeRef}
                // src={URL.createObjectURL(file)}
                title="pdf"
                style={{ width: '100%', height: '100%', border: 'none' }}
            />}
            {!file && <Stack direction="column" justifyContent="center" alignItems="center" sx={{ width: 1, height: 1 }}>
                <PictureAsPdfIcon color='secondary' sx={{ fontSize: 35 }} />
                <Typography variant="h2" color="text.secondary">
                    לא נבחר קובץ
                </Typography>
            </Stack>}
        </Box>
    )
}

export default PdfViewer;