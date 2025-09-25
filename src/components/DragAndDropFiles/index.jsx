import React from "react";

import { Stack, Typography, Box, Paper } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import Background from "./Background";

//status: error | success | uploading | start
const DragAndDropFiles = ({ height, uploadButton, multiple, doAction, statusUpload, setFiles }) => {

    const inputRef = React.useRef(null);


    const theme = useTheme();
    const reducer = (state, action) => {
        switch (action.type) {
            case 'SET_DROP_DEPTH':
                return { ...state, dropDepth: action.dropDepth }
            case 'SET_IN_DROP_ZONE':
                return { ...state, inDropZone: action.inDropZone };
            case 'ADD_FILE_TO_LIST':
                return { ...state, fileList: state.fileList.concat(action.files) };
            case 'DELETE_FILE_TO_LIST':
                return { ...state, fileList: state.fileList.filter(f => f.name !== action.file.name) };
            default:
                return state;
        }
    };

    const [data, dispatch] = React.useReducer(
        reducer, { dropDepth: 0, inDropZone: false, fileList: [] }
    );

    React.useEffect(() => {
        if (setFiles) setFiles(data.fileList)
    }, [data.fileList])



    const handleDragEnter = e => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'SET_DROP_DEPTH', dropDepth: data.dropDepth + 1 });
        // console.log(e, "enter");
    };

    const handleDragLeave = e => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'SET_DROP_DEPTH', dropDepth: data.dropDepth - 1 });
        if (data.dropDepth > 0) return
        dispatch({ type: 'SET_IN_DROP_ZONE', inDropZone: false })
        // console.log(e, "leave");
    };

    const handleDragOver = e => {
        e.dataTransfer.dropEffect = 'copy';
        dispatch({ type: 'SET_IN_DROP_ZONE', inDropZone: true });
        e.preventDefault();
        e.stopPropagation();
        // console.log(e, "over");
    };

    const handleDrop = e => {
        e.preventDefault();
        e.stopPropagation();
        let files = [...e.dataTransfer.files];

        if (files && files.length > 0) {
            const existingFiles = data.fileList.map(f => f.name)
            files = files.filter(f => !existingFiles.includes(f.name))

            dispatch({ type: 'ADD_FILE_TO_LIST', files });
            e.dataTransfer.clearData();
            dispatch({ type: 'SET_DROP_DEPTH', dropDepth: 0 });
            dispatch({ type: 'SET_IN_DROP_ZONE', inDropZone: false });

            if (!multiple && !uploadButton) doAction(files);
        }
    };
    return (
        <>
            <input
                style={{ display: 'none' }}
                ref={inputRef}
                type="file"
                multiple
                onChange={(e) => {
                    let file = e.target.files;
                    // console.log(file.length);
                    let files = [];
                    for (let i = 0; i < file.length; i++) {
                        files.push(file[i])
                    }
                    if (files && files.length > 0) {
                        const existingFiles = data.fileList.map(f => f.name)
                        files = files.filter(f => !existingFiles.includes(f.name))

                        dispatch({ type: 'ADD_FILE_TO_LIST', files });
                        //e.dataTransfer.clearData();
                        dispatch({ type: 'SET_DROP_DEPTH', dropDepth: 0 });
                        dispatch({ type: 'SET_IN_DROP_ZONE', inDropZone: false });
                        if (!multiple && !uploadButton) doAction(files);
                    }
                    // console.log(file.map(a=>a));
                    // if (file) {
                    //     const reader = new FileReader();
                    //     reader.readAsArrayBuffer(file);
                    //     reader.onload = (e) => {
                    //         console.log(e);
                    //     };

                    //     reader.onerror = (evt) => {
                    //         console.log("error reading file");
                    //     };
                    // }
                }}
            />

            <Box
                onDrop={e => handleDrop(e)}
                onDragOver={e => handleDragOver(e)}
                onDragEnter={e => handleDragEnter(e)}
                onDragLeave={e => handleDragLeave(e)}
                onClick={() => data.fileList.length === 0 && inputRef.current.click()}
                sx={{
                    width: 1,
                    height: height,
                    p: 3,
                    borderRadius: 3,
                    bgcolor: theme.palette.secondary.light
                }}
            >

                <Paper
                    elevation={0}
                    sx={{
                        width: 1,
                        height: 1,
                        p: 5,
                        borderRadius: 3,
                        bgcolor: theme.palette.secondary.lighter
                    }}>
                    <Background
                        files={data.fileList}
                        status={data.inDropZone}
                        uploadButton={uploadButton}
                        dispatch={dispatch}
                        doAction={doAction}
                        multiple={multiple}
                        inputRef={inputRef}
                        statusUpload={statusUpload}
                    />
                </Paper>
            </Box>
        </>
    );
}

DragAndDropFiles.defaultProps = {
    title: "העלה קובץ",
    height: 250,
    multiple: false,
    uploadButton: true,
    doAction: (f) => console.log(f),
    setFiles: null,
    statusUpload: 'start'
}
export default DragAndDropFiles