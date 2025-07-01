import React, { useState, useEffect, useRef } from "react";
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
import PersonIcon from '@mui/icons-material/Person';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
    getMessagesByConversation,
    addMessage,
    markConversationAsReadBySystem,
    updateMessageTranscription,
    updateMessageForFollowUp
} from '../../../api/services/messages';
import { getConversationById } from '../../../api/services/conversations';
import AudioMessage from './AudioMessage';

const ChatWindow = ({ selectedContact, selectedType }) => {
    const [message, setMessage] = useState('');
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // רפרנס לאזור ההודעות לגלילה אוטומטית
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const queryClient = useQueryClient();

    // פונקציה לגלילה להודעה האחרונה
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

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

    // גלילה אוטומטית כשמשתנה איש הקשר הנבחר
    useEffect(() => {
        if (selectedContact) {
            // איפוס מצב העתקה בעת מעבר לשיחה אחרת
            setCopySuccess(false);
            // השהיה קטנה כדי לוודא שההודעות נטענו
            const timer = setTimeout(() => {
                scrollToBottom();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedContact]);

    // גלילה אוטומטית כשמגיעות הודעות חדשות
    useEffect(() => {
        if (messages.length > 0) {
            // השהיה קטנה כדי לוודא שה-DOM התעדכן
            const timer = setTimeout(() => {
                scrollToBottom();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [messages.length]);

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

                // גלילה להודעה החדשה אחרי שליחה
                setTimeout(() => {
                    scrollToBottom();
                }, 200);
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
        closeMessageMenu();
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

    // אם יש שגיאה בטעינת ההודעות
    if (messagesStatus === 'error') {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 2,
                bgcolor: 'background.default'
            }}>
                <Alert severity="error">
                    שגיאה בטעינת ההודעות: {messagesError?.message}
                </Alert>
                <Typography variant="body2" color="text.secondary">
                    נסה לרענן את הדף או לבחור שיחה אחרת
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
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {conversation?.customerName || 'לא ידוע'}
                        </Typography>
                        {conversation?.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    {conversation.phone}
                                </Typography>
                                <Tooltip title={copySuccess ? "הועתק!" : "העתק מספר טלפון"}>
                                    <IconButton
                                        size="small"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(conversation.phone);
                                                setCopySuccess(true);
                                                setTimeout(() => setCopySuccess(false), 2000);
                                            } catch (err) {
                                                console.error('Failed to copy phone number:', err);
                                            }
                                        }}
                                        sx={{ 
                                            color: copySuccess ? 'success.main' : 'inherit',
                                            opacity: 0.8,
                                            '&:hover': {
                                                opacity: 1,
                                                bgcolor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        <ContentCopyIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                        {/* <Chip 
                            label={conversation?.isActive ? "פעיל" : "לא </Box>פעיל"} 
                            size="small" 
                            color={conversation?.isActive ? "success" : "default"}
                            variant="outlined"
                            sx={{ 
                                color: 'white',
                                borderColor: 'rgba(255, 255, 255, 0.5)'
                            }}
                        /> */}
                    </Box>
                </Box>
            </Paper>

            {/* אזור ההודעות */}
            {messagesStatus === 'loading' ? (
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexGrow: 1
                }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box
                    ref={messagesContainerRef}
                    sx={{
                        flexGrow: 1,
                        overflow: 'auto',
                        bgcolor: 'background.default',
                        p: 1
                    }}
                >
                    <List sx={{ py: 0 }}>
                        {messages.map((msg) => {
                            const isSystemMessage = msg.role === 'system';
                            const displayTime = msg.timestamp?.toDate ?
                                msg.timestamp.toDate().toLocaleTimeString('he-IL', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) :
                                msg.timestamp;

                            return (
                                <ListItem
                                    key={msg.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: isSystemMessage ? 'flex-end' : 'flex-start',
                                        mb: 1,
                                        px: 1
                                    }}
                                >
                                    <Paper
                                        sx={{
                                            p: 1.5,
                                            maxWidth: '70%',
                                            bgcolor: isSystemMessage ? 'primary.main' : 'background.paper',
                                            color: isSystemMessage ? 'primary.contrastText' : 'text.primary',
                                            borderRadius: 2,
                                            borderTopRightRadius: isSystemMessage ? 0.5 : 2,
                                            borderTopLeftRadius: isSystemMessage ? 2 : 0.5,
                                            position: 'relative'
                                        }}
                                        elevation={1}
                                    >
                                        {/* תוכן ההודעה */}
                                        {msg.fileType === 'audio' ? (
                                            <AudioMessage
                                                messageId={msg.id}
                                                audioFile={msg.filePath}
                                                fileName={msg.fileName}
                                                transcription={msg.transcription}
                                                onTranscriptionUpdate={(messageId, transcription) => {
                                                    updateTranscriptionMutation.mutate({
                                                        messageId,
                                                        transcription
                                                    });
                                                }}
                                                canEdit={!isSystemMessage}
                                            />
                                        ) : (
                                            <Typography variant="body2">
                                                {msg.message}
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
                                                {displayTime}
                                            </Typography>

                                            {!isSystemMessage && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    {msg.isForFollowUp && (
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

                                        {/* תגיות */}
                                        {msg.tags && msg.tags.length > 0 && (
                                            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                                                {msg.tags.map((tag, index) => (
                                                    <Chip
                                                        key={index}
                                                        label={tag}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontSize: '0.7rem', height: 20 }}
                                                    />
                                                ))}
                                            </Stack>
                                        )}
                                    </Paper>
                                </ListItem>
                            );
                        })}

                        {messages.length === 0 && (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <Typography variant="body2" color="text.secondary">
                                    אין הודעות בשיחה זו
                                </Typography>
                            </Box>
                        )}

                        {/* אלמנט סמוי לגלילה אוטומטית */}
                        <div ref={messagesEndRef} />
                    </List>

                    {/* תפריט פעולות הודעה */}
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={closeMessageMenu}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        {(() => {
                            const selectedMsg = messages.find(m => m.id === selectedMessage);
                            return selectedMsg?.isForFollowUp ? (
                                <MenuItem onClick={() => handleMarkForFollowUp(selectedMessage, true)}>
                                    <BookmarkBorderIcon sx={{ mr: 1 }} />
                                    בטל סימון לטיפול
                                </MenuItem>
                            ) : (
                                <MenuItem onClick={() => handleMarkForFollowUp(selectedMessage, false)}>
                                    <BookmarkIcon sx={{ mr: 1 }} />
                                    סמן לטיפול בהמשך
                                </MenuItem>
                            );
                        })()}
                    </Menu>
                </Box>
            )}

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
                        disabled={sendMessageMutation.isLoading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 3,
                            }
                        }}
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sendMessageMutation.isLoading}
                        sx={{
                            bgcolor: message.trim() && !sendMessageMutation.isLoading ? 'primary.main' : 'action.disabled',
                            color: 'white',
                            '&:hover': {
                                bgcolor: message.trim() && !sendMessageMutation.isLoading ? 'primary.dark' : 'action.disabled',
                            },
                            '&.Mui-disabled': {
                                color: 'action.disabled',
                            }
                        }}
                    >
                        {sendMessageMutation.isLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            <SendIcon />
                        )}
                    </IconButton>
                </Stack>
            </Paper>
        </Box>
    );
};

export default ChatWindow;
