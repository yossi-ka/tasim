import React, { useState } from "react";
import {
    Box,
    IconButton,
    TextField,
    Typography,
    Tooltip,
    Button
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../../firebase-config';

const AudioMessage = ({
    messageId,
    audioFile,
    fileName,
    transcription,
    onTranscriptionUpdate,
    canEdit = false
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [transcriptionText, setTranscriptionText] = useState(transcription || '');
    const [isLoading, setIsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState(null);

    const handleSaveTranscription = () => {
        onTranscriptionUpdate(messageId, transcriptionText);
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setTranscriptionText(transcription || '');
        setIsEditing(false);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSaveTranscription();
        }
    };

    const handlePlayAudio = async () => {
        try {
            // אם כבר משמיע - עצור
            if (isPlaying && audio) {
                audio.pause();
                setIsPlaying(false);
                return;
            }

            setIsLoading(true);

            // Debug: בדיקת נתיב הקובץ
            console.log('Audio file path:', audioFile);

            // טען URL אם עדיין לא נטען
            let url = audioUrl;
            if (!url) {
                // קבלת URL להורדה מ-Firebase Storage
                // const storageRef = ref(storage, audioFile);
                // console.log('Storage ref:', storageRef);

                // url = await getDownloadURL(storageRef);
                // console.log('Download URL:', url);
                url = "https://www.call2all.co.il/ym/api/DownloadFile?token=023132474:2015&path=ivr2:voicemail/" + fileName;
                setAudioUrl(url);
            }

            // צור אלמנט אודיו אם עדיין לא קיים
            let audioElement = audio;
            if (!audioElement) {
                audioElement = new Audio(url);

                // אירועים לאלמנט האודיו
                audioElement.onended = () => {
                    setIsPlaying(false);
                };

                audioElement.onerror = (e) => {
                    console.error('Audio playback error:', e);
                    setIsPlaying(false);
                    alert('שגיאה בהשמעת הקובץ');
                };

                setAudio(audioElement);
            }

            // השמע
            await audioElement.play();
            setIsPlaying(true);

        } catch (error) {
            console.error('שגיאה בהשמעת הקובץ:', error);
            alert(`שגיאה בהשמעת קובץ האודיו: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box>
            {/* נגן אודיו */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    mb: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Button
                    variant="contained"
                    size="medium"
                    onClick={handlePlayAudio}
                    disabled={isLoading}
                    startIcon={
                        isLoading ? null :
                            isPlaying ? <PauseIcon /> : <VolumeUpIcon />
                    }
                    sx={{
                        width: 180,           // רוחב קבוע
                        height: 44,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        boxShadow: 2,
                        '&:hover': {
                            boxShadow: 4,
                        }
                    }}
                >
                    {isLoading ? 'טוען הקלטה...' :
                        isPlaying ? 'עצור הקלטה' : 'השמע הקלטה'}
                </Button>
            </Box>

            {/* בלוק תמלול - מופיע תמיד */}
            <Box sx={{
                p: 1.2,
                bgcolor: transcription && !isEditing ? 'grey.50' : 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: isEditing ? 'primary.main' : 'grey.300'
            }}>
                {!isEditing ? (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: transcription ? 0.5 : 0 }}>
                            <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                                📝 תמלול:
                            </Typography>
                            {canEdit && (
                                <Tooltip title="עריכת תמלול">
                                    <IconButton
                                        size="small"
                                        onClick={() => setIsEditing(true)}
                                        color="secondary"
                                        sx={{ p: 0.5 }}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                        {transcription ? (
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                                {transcription}
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ fontSize: '0.8rem' }}>
                                אין תמלול זמין
                            </Typography>
                        )}
                    </>
                ) : (
                    <>
                        <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', mb: 1, display: 'block', fontSize: '0.75rem' }}>
                            ✏️ עריכת תמלול:
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={3}
                            placeholder="הקלד תמלול של ההקלטה..."
                            value={transcriptionText}
                            onChange={(e) => setTranscriptionText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            size="small"
                            sx={{
                                mb: 1,
                                '& .MuiInputBase-input': {
                                    fontSize: '0.85rem',
                                    padding: '8px 12px'
                                }
                            }}
                            autoFocus
                        />
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="שמור תמלול (Enter)">
                                <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={handleSaveTranscription}
                                    disabled={!transcriptionText.trim()}
                                    sx={{ p: 0.5 }}
                                >
                                    <CheckIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="ביטול">
                                <IconButton
                                    size="small"
                                    onClick={handleCancelEdit}
                                    sx={{ p: 0.5 }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default AudioMessage;
