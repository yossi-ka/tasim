import React, { useState } from "react";
import { 
    Box, 
    IconButton, 
    TextField,
    Typography,
    Tooltip
} from "@mui/material";
import AudioFileIcon from '@mui/icons-material/AudioFile';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const AudioMessage = ({ 
    messageId, 
    audioFile, 
    transcription, 
    onTranscriptionUpdate,
    canEdit = false 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [transcriptionText, setTranscriptionText] = useState(transcription || '');

    const handleSaveTranscription = () => {
        onTranscriptionUpdate(messageId, transcriptionText);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setTranscriptionText(transcription || '');
        setIsEditing(false);
    };

    const handlePlayAudio = () => {
        // כאן תוסיף את הלוגיקה להשמעת הקובץ
        console.log('השמעת קובץ אודיו:', audioFile);
    };

    return (
        <Box>
            {/* קובץ אודיו */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    mb: (transcription || isEditing) ? 1 : 0,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <AudioFileIcon color="primary" />
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                        {audioFile}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        קובץ אודיו
                    </Typography>
                </Box>
                
                <Tooltip title="השמע">
                    <IconButton 
                        size="small"
                        onClick={handlePlayAudio}
                        color="primary"
                    >
                        <PlayArrowIcon />
                    </IconButton>
                </Tooltip>
                
                {canEdit && (
                    <Tooltip title="עריכת תמלול">
                        <IconButton 
                            size="small"
                            onClick={() => setIsEditing(true)}
                            color="secondary"
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {/* תמלול קיים */}
            {transcription && !isEditing && (
                <Box sx={{ 
                    p: 1.5, 
                    bgcolor: 'grey.50', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.300'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                            📝 תמלול:
                        </Typography>
                    </Box>
                    <Typography variant="body2">
                        {transcription}
                    </Typography>
                </Box>
            )}

            {/* עריכת תמלול */}
            {isEditing && (
                <Box sx={{ 
                    p: 1.5, 
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'primary.main'
                }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', mb: 1, display: 'block' }}>
                        ✏️ עריכת תמלול:
                    </Typography>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="הקלד תמלול של ההקלטה..."
                        value={transcriptionText}
                        onChange={(e) => setTranscriptionText(e.target.value)}
                        size="small"
                        sx={{ mb: 1 }}
                        autoFocus
                    />
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="שמור תמלול">
                            <IconButton 
                                size="small" 
                                color="primary"
                                onClick={handleSaveTranscription}
                                disabled={!transcriptionText.trim()}
                            >
                                <CheckIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="ביטול">
                            <IconButton 
                                size="small" 
                                onClick={handleCancelEdit}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default AudioMessage;
