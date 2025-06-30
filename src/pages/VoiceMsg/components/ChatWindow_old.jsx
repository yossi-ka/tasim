import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { 
    Box, 
    Paper,
    Typography,
    List,
    ListItem,
    Avatar,
    TextField,
    IconButton,
    Divider,
    Chip,
    Stack,
    Tooltip,
    Menu,
    MenuItem,
    CircularProgress,
    Alert
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PersonIcon from '@mui/icons-material/Person';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { 
    getMessagesByConversation, 
    addMessage, 
    markConversationAsReadBySystem,
    updateMessageTranscription,
    updateMessageForFollowUp
} from '../../../api/services/messages';
import { getConversationById } from '../../../api/services/conversations';

const ChatWindow = ({ selectedContact, selectedType }) => {
    const [message, setMessage] = useState('');
    const [editingTranscription, setEditingTranscription] = useState(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);

    const queryClient = useQueryClient();

    // קבלת פרטי השיחה
    const { data: conversation } = useQuery(
        ['conversation', selectedContact],
        () => getConversationById(selectedContact),
        {
            enabled: !!selectedContact,
            staleTime: 5 * 60 * 1000,
        }
    );

    // קבלת ההודעות בשיחה
    const { 
        data: messages = [], 
        status: messagesStatus, 
        error: messagesError,
        refetch: refetchMessages 
    } = useQuery(
        ['messages', selectedContact],
        () => getMessagesByConversation(selectedContact),
        {
            enabled: !!selectedContact,
            refetchInterval: 10000, // רענון כל 10 שניות
            refetchOnWindowFocus: true,
            staleTime: 30 * 1000, // 30 שניות
        }
    );

    // סימון השיחה כנקראה כשנכנסים אליה
    useEffect(() => {
        if (selectedContact && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                markConversationAsReadBySystem(selectedContact, lastMessage.id)
                    .catch(error => console.error('Error marking as read:', error));
            }
        }
    }, [selectedContact, messages]);

    // מוטציה לשליחת הודעה
    const sendMessageMutation = useMutation(
        (messageData) => addMessage(messageData),
        {
            onSuccess: () => {
                setMessage('');
                // עדכון הקאש
                queryClient.invalidateQueries(['messages', selectedContact]);
                queryClient.invalidateQueries(['conversation', selectedContact]);
                queryClient.invalidateQueries('allConversations');
                queryClient.invalidateQueries('pendingConversations');
            },
            onError: (error) => {
                console.error('Error sending message:', error);
            }
        }
    );

    // מוטציה לעדכון תמלול
    const updateTranscriptionMutation = useMutation(
        ({ messageId, transcription }) => updateMessageTranscription(messageId, transcription),
        {
            onSuccess: () => {
                setEditingTranscription(null);
                setTranscriptionText('');
                queryClient.invalidateQueries(['messages', selectedContact]);
            },
            onError: (error) => {
                console.error('Error updating transcription:', error);
            }
        }
    );

    // מוטציה לסימון הודעה לטיפול בהמשך
    const markForFollowUpMutation = useMutation(
        ({ messageId, isForFollowUp }) => updateMessageForFollowUp(messageId, isForFollowUp),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['messages', selectedContact]);
                queryClient.invalidateQueries(['conversation', selectedContact]);
                queryClient.invalidateQueries('allConversations');
                queryClient.invalidateQueries('pendingConversations');
            },
            onError: (error) => {
                console.error('Error updating follow-up status:', error);
            }
        }
    );

    const handleSendMessage = () => {
        if (message.trim() && selectedContact && !sendMessageMutation.isLoading) {
            sendMessageMutation.mutate({
                conversationId: selectedContact,
                role: 'system', // הודעה מהמערכת
                message: message.trim(),
                fileId: "",
                fileType: "",
                fileName: "",
                fileSize: "",
                transcription: "",
                isForFollowUp: false,
                tags: []
            });
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleMarkForFollowUp = (messageId, currentStatus) => {
        markForFollowUpMutation.mutate({
            messageId,
            isForFollowUp: !currentStatus
        });
    };

    const handleEditTranscription = (messageId, currentTranscription) => {
        setEditingTranscription(messageId);
        setTranscriptionText(currentTranscription || '');
    };

    const handleSaveTranscription = (messageId) => {
        if (transcriptionText.trim()) {
            updateTranscriptionMutation.mutate({
                messageId,
                transcription: transcriptionText.trim()
            });
        }
    };

    const handleCancelTranscription = () => {
        setEditingTranscription(null);
        setTranscriptionText('');
    };

    const openMessageMenu = (event, messageId) => {
        setMenuAnchor(event.currentTarget);
        setSelectedMessage(messageId);
    };

    const closeMessageMenu = () => {
        setMenuAnchor(null);
        setSelectedMessage(null);
    };

    // אם אין שיחה נבחרת, הצג הודעה
    if (!selectedContact) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    height: '100%',
                    bgcolor: 'background.default'
                }}
            >
                <Typography variant="h6" color="text.secondary">
                    בחר איש קשר להתחלת שיחה
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* כותרת השיחה */}
            <Paper 
                sx={{ 
                    p: 2, 
                    borderRadius: 0,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText'
                }}
                elevation={2}
            >
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                        <PersonIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6">
                            יוסי כהן
                        </Typography>
                        <Chip 
                            label="מחובר" 
                            size="small" 
                            color="success"
                            variant="outlined"
                            sx={{ 
                                color: 'white',
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* אזור ההודעות */}
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    overflow: 'auto',
                    bgcolor: 'background.default',
                    p: 1
                }}
            >
                <List sx={{ py: 0 }}>
                    {messages.map((msg) => (
                        <ListItem 
                            key={msg.id}
                            sx={{ 
                                display: 'flex',
                                justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
                                mb: 1,
                                px: 1
                            }}
                        >
                            <Paper
                                sx={{
                                    p: 1.5,
                                    maxWidth: '70%',
                                    bgcolor: msg.isMe ? 'primary.main' : 'background.paper',
                                    color: msg.isMe ? 'primary.contrastText' : 'text.primary',
                                    borderRadius: 2,
                                    borderTopRightRadius: msg.isMe ? 0.5 : 2,
                                    borderTopLeftRadius: msg.isMe ? 2 : 0.5,
                                    position: 'relative'
                                }}
                                elevation={1}
                            >
                                {/* תוכן ההודעה */}
                                {msg.type === 'audio' ? (
                                    <Box>
                                        {/* קובץ אודיו */}
                                        <Box 
                                            sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 1,
                                                p: 1,
                                                bgcolor: 'action.hover',
                                                borderRadius: 1,
                                                mb: msg.transcription || editingTranscription === msg.id ? 1 : 0
                                            }}
                                        >
                                            <AudioFileIcon color="primary" />
                                            <Typography variant="body2">
                                                {msg.audioFile}
                                            </Typography>
                                            {selectedType === 'incoming' && (
                                                <Tooltip title="עריכת תמלול">
                                                    <IconButton 
                                                        size="small"
                                                        onClick={() => handleEditTranscription(msg.id, msg.transcription)}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>

                                        {/* תמלול קיים */}
                                        {msg.transcription && editingTranscription !== msg.id && (
                                            <Box sx={{ 
                                                p: 1, 
                                                bgcolor: 'grey.50', 
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'grey.200'
                                            }}>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                                                    תמלול:
                                                </Typography>
                                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                    {msg.transcription}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* עריכת תמלול */}
                                        {editingTranscription === msg.id && (
                                            <Box sx={{ mt: 1 }}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    maxRows={3}
                                                    placeholder="הקלד תמלול..."
                                                    value={transcriptionText}
                                                    onChange={(e) => setTranscriptionText(e.target.value)}
                                                    size="small"
                                                    sx={{ mb: 1 }}
                                                />
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton 
                                                        size="small" 
                                                        color="primary"
                                                        onClick={() => handleSaveTranscription(msg.id)}
                                                    >
                                                        <CheckIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={handleCancelTranscription}
                                                    >
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <Typography variant="body2">
                                        {msg.text}
                                    </Typography>
                                )}

                                {/* זמן וכפתורי פעולה */}
                                <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    mt: 0.5 
                                }}>
                                    <Typography 
                                        variant="caption" 
                                        sx={{ opacity: 0.7 }}
                                    >
                                        {msg.timestamp}
                                    </Typography>
                                    
                                    {!msg.isMe && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {msg.markedForFollowUp && (
                                                <Chip 
                                                    label="לטיפול" 
                                                    size="small" 
                                                    color="warning"
                                                    sx={{ 
                                                        fontSize: '0.6rem', 
                                                        height: 16,
                                                        '& .MuiChip-label': { px: 0.5 }
                                                    }}
                                                />
                                            )}
                                            <IconButton 
                                                size="small"
                                                onClick={(e) => openMessageMenu(e, msg.id)}
                                                sx={{ opacity: 0.7 }}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </ListItem>
                    ))}
                </List>

                {/* תפריט פעולות הודעה */}
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={closeMessageMenu}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    {messages.find(m => m.id === selectedMessage)?.markedForFollowUp ? (
                        <MenuItem onClick={() => handleUnmarkForFollowUp(selectedMessage)}>
                            <BookmarkBorderIcon sx={{ mr: 1 }} />
                            בטל סימון לטיפול
                        </MenuItem>
                    ) : (
                        <MenuItem onClick={() => handleMarkForFollowUp(selectedMessage)}>
                            <BookmarkIcon sx={{ mr: 1 }} />
                            סמן לטיפול בהמשך
                        </MenuItem>
                    )}
                </Menu>
            </Box>

            <Divider />

            {/* אזור כתיבת הודעה */}
            <Paper 
                sx={{ 
                    p: 2,
                    borderRadius: 0,
                    bgcolor: 'background.paper'
                }}
                elevation={3}
            >
                <Stack direction="row" spacing={1} alignItems="flex-end">
                    <IconButton color="primary">
                        <AttachFileIcon />
                    </IconButton>
                    <IconButton color="primary">
                        <EmojiEmotionsIcon />
                    </IconButton>
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="כתוב הודעה..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        variant="outlined"
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                            }
                        }}
                    />
                    <IconButton 
                        color="primary" 
                        onClick={handleSendMessage}
                        disabled={!message.trim()}
                        sx={{
                            bgcolor: message.trim() ? 'primary.main' : 'action.disabled',
                            color: 'white',
                            '&:hover': {
                                bgcolor: message.trim() ? 'primary.dark' : 'action.disabled',
                            },
                            '&.Mui-disabled': {
                                color: 'action.disabled',
                            }
                        }}
                    >
                        <SendIcon />
                    </IconButton>
                </Stack>
            </Paper>
        </Box>
    );
};

export default ChatWindow;
