import React from "react";

const Drop = ({ data, dispatch, title }) => {
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
        // console.log(e.dataTransfer, "-----");
        // console.log(e.dataTransfer.files, "-----");
        let files = [...e.dataTransfer.files];

        if (files && files.length > 0) {
            const existingFiles = data.fileList.map(f => f.name)
            files = files.filter(f => !existingFiles.includes(f.name))

            dispatch({ type: 'ADD_FILE_TO_LIST', files });
            e.dataTransfer.clearData();
            dispatch({ type: 'SET_DROP_DEPTH', dropDepth: 0 });
            dispatch({ type: 'SET_IN_DROP_ZONE', inDropZone: false });
        }
    };
    return (
        <div className={'drag-drop-zone'}
            style={{
                padding: "2rem",
                textAlign: "center",
                background: "#2196f3",
                borderRadius: "0.5rem",
                boxShadow: "5px 5px 10px #90caf9",
            }}
            onDrop={e => handleDrop(e)}
            onDragOver={e => handleDragOver(e)}
            onDragEnter={e => handleDragEnter(e)}
            onDragLeave={e => handleDragLeave(e)}
        >

            {/* <Stack direction="column" alignItems="center" spacing={1} justifyContent="center"
                // sx={{ width: 1, height: counter ? window.innerHeight * ((dataToShow && dataToShow.length > 0 && (statuses || title)) ? 0.75 : 0.80) : 200 }}
                >
                {(data.fileList = 0) && <Typography variant={counter ? "h1" : "h3"} component='p' sx={{ color: theme.palette.text.secondary }}>
                    {title}
                </Typography>}
            </Stack> */}
            <p>Drag files here to upload</p>
        </div>

    );
};

Drop.defaultProps = {
    title: "העלה קובץ"
}
export default Drop