import React from "react";

import { Avatar, Button, List, ListItem, ListItemAvatar, ListItemText, Stack, Typography, IconButton, Box } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import AddIcon from '@mui/icons-material/Add';
import DisabledByDefaultIcon from '@mui/icons-material/DisabledByDefault';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import BackupIcon from '@mui/icons-material/Backup';


const Background = ({ status, files, title, uploadButton, dispatch, small, doAction, multiple, inputRef, statusUpload }) => {
    const theme = useTheme();

    return (

        <Stack direction="column" alignItems="center" spacing={1} justifyContent="center"
            sx={{ width: 1, height: 1 }}>
            {(status) && <CloudUploadIcon color='secondary' sx={{ fontSize: 75 }} />}
            {status && <Typography variant="h6" align="justify" component='p' sx={{ color: theme.palette.text.secondary }}>
                אפשר לשחרר
            </Typography>}
            {(files == 0 && !status) && <CloudUploadIcon color='secondary' sx={{ fontSize: 75 }} />}
            {(files == 0 && !status) && <Typography variant="h6" align="center" component='p' sx={{ color: theme.palette.text.secondary }}>
                {title}
            </Typography>}


            {(files.length > 0 && (uploadButton || multiple)) && statusUpload != "uploading" && <Box
                sx={{
                    maxHeight: 1,
                    overflow: "auto",
                }}
            >
                <List >
                    {files.map((file, idx) => <ListItem
                        key={idx}
                        secondaryAction={
                            <IconButton edge="end" aria-label="delete" onClick={() => dispatch({ type: "DELETE_FILE_TO_LIST", file: file })}>
                                <DeleteIcon fontSize="medium" color="error" />
                            </IconButton>} >
                        {/* <ListItemAvatar>
                            <Avatar sx={{width: 30, height: 30}}>
                                <FolderIcon sx={{fontSize: 16}}/>
                            </Avatar>
                        </ListItemAvatar> */}
                        <ListItemText primary={file.name} />
                    </ListItem>)}
                </List>
            </Box>}
            {statusUpload != "uploading" && <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">

                {files.length > 0 && multiple && <Button variant="contained" onClick={() => inputRef.current.click()} endIcon={<AddIcon />}>הוספת קבצים</Button>}


                {(files.length > 0 && uploadButton) && <Button variant="contained" onClick={() => doAction(files)} endIcon={<BackupIcon />}>העלאה</Button>}
            </Stack>}
            {statusUpload == "uploading" && <>
                <CloudUploadIcon color='secondary' sx={{ fontSize: 75 }} />
                <Typography align="center" variant="h4" component='p' sx={{ color: theme.palette.text.secondary }}>
                    מעלה קבצים
                </Typography>
            </>}
            {(files.length > 0 && !uploadButton && statusUpload == "success") && <>
                <CloudDoneIcon color='secondary' sx={{ fontSize: 75 }} />
                <Typography align="center" variant="h4" component='p' sx={{ color: theme.palette.text.secondary }}>
                    העלאה הסתיימה בהצלחה
                </Typography>
            </>}
            {(files.length > 0 && !uploadButton && statusUpload == "success") && <>
                <DisabledByDefaultIcon color='secondary' sx={{ fontSize: 75 }} />
                <Typography align="center" variant="h4" component='p' sx={{ color: theme.palette.text.secondary }}>
                    שגיאה בהעלאה
                </Typography>
            </>}
            {/* {(files.length > 0 && !uploadButton) && <CloudDoneIcon color='secondary' sx={{ fontSize: 75 }} />}
            {(files.length > 0 && !uploadButton) && <Typography align="center" variant="h4" component='p' sx={{ color: theme.palette.text.secondary }}>
                {statusUpload == "uploading" && "מעלה קבצים"}
                {statusUpload == "success" && "הקבצים עלו בהצלחה"}
                {statusUpload == "error" && "שגיאה בהעלאת"}
            </Typography>} */}
        </Stack>
    );
}

Background.defaultProps = {
    files: 0,
    status: false,
    title: "ניתן לגרור קבצים לכאן",
    small: false
}
export default Background