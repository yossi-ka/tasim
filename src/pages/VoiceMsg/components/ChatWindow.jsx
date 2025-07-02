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
    Button,
    Divider,
    Chip,
    Stack,
    Tooltip,
    CircularProgress,
    Alert
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CloseIcon from '@mui/icons-material/Close';
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
                    .then(() => {
                        // רענון נתונים לאחר סימון כנקרא
                        queryClient.invalidateQueries('allConversations');
                        queryClient.invalidateQueries('pendingConversations');
                        queryClient.invalidateQueries('messageCounts');
                    })
                    .catch(error => console.error('Error marking as read:', error));
            }
        }
    }, [selectedContact, messages, queryClient]);

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
                queryClient.invalidateQueries('messageCounts'); // רענון ספירת ההודעות

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
                queryClient.invalidateQueries('messageCounts'); // רענון ספירת ההודעות
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

    // פונקציה להצגת תאריך ושעה
    const getDisplayDateTime = (timestamp) => {
        if (!timestamp) return '';

        const messageDate = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

        const timeString = messageDate.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit'
        });

        if (messageDay.getTime() === today.getTime()) {
            return `היום ${timeString}`;
        } else if (messageDay.getTime() === yesterday.getTime()) {
            return `אתמול ${timeString}`;
        } else {
            const dateString = messageDate.toLocaleDateString('he-IL', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });
            return `${dateString} ${timeString}`;
        }
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
                            const displayTime = getDisplayDateTime(msg.timestamp);

                            return (
                                <ListItem
                                    key={msg.id}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: isSystemMessage ? 'flex-end' : 'flex-start',
                                        mb: 0.75,
                                        px: 1
                                    }}
                                >
                                    <Paper
                                        sx={{
                                            p: 1.5,
                                            maxWidth: '70%',
                                            bgcolor: isSystemMessage ? 'primary.main' : 'background.paper',
                                            color: isSystemMessage ? 'primary.contrastText' : 'text.primary',
                                            borderRadius: isSystemMessage ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            position: 'relative',
                                            boxShadow: isSystemMessage ? '0 2px 8px rgba(25, 118, 210, 0.25)' : '0 1px 4px rgba(0,0,0,0.1)',
                                            border: isSystemMessage ? '1px solid' : '1px solid',
                                            borderColor: isSystemMessage ? 'primary.dark' : 'grey.300',
                                            lineHeight: 1.4,
                                            background: isSystemMessage
                                                ? 'primary.main'
                                                : 'background.paper'
                                        }}
                                        elevation={0}
                                    >
                                        {/* תוכן ההודעה */}
                                        {msg.fileType === 'audio' ? (
                                            <Box>
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
                                                {/* הצגת תמלול נפרד עבור הודעות קוליות */}
                                                {msg.transcription && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            mt: 1,
                                                            p: 1,
                                                            backgroundColor: isSystemMessage
                                                                ? 'rgba(255,255,255,0.15)'
                                                                : 'grey.100',
                                                            borderRadius: 1.5,
                                                            fontStyle: 'italic',
                                                            lineHeight: 1.4,
                                                            fontSize: '0.8rem',
                                                            border: isSystemMessage
                                                                ? '1px solid rgba(255,255,255,0.2)'
                                                                : '1px solid',
                                                            borderColor: isSystemMessage
                                                                ? 'rgba(255,255,255,0.2)'
                                                                : 'grey.300',
                                                            color: isSystemMessage
                                                                ? 'rgba(255,255,255,0.9)'
                                                                : 'text.secondary'
                                                        }}
                                                    >
                                                        📝 {msg.transcription}
                                                    </Typography>
                                                )}
                                            </Box>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    lineHeight: 1.5,
                                                    fontSize: '0.9rem',
                                                    fontWeight: isSystemMessage ? 500 : 400
                                                }}
                                            >
                                                {msg.message}
                                            </Typography>
                                        )}

                                        {/* זמן וכפתורי פעולה */}
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: !isSystemMessage ? 'space-between' : 'flex-start',
                                            alignItems: 'flex-end',
                                            mt: 0.75,
                                            gap: 1
                                        }}>
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    opacity: 0.7,
                                                    fontSize: '0.7rem',
                                                    fontWeight: 500,
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {displayTime}
                                            </Typography>

                                            {!isSystemMessage && (
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 0.5,
                                                    flexShrink: 0
                                                }}>
                                                    {/* הצגת סטטוס טיפול או כפתור לסימון */}
                                                    {msg.isForFollowUp ? (
                                                        <Chip
                                                            label="לטיפול"
                                                            size="small"
                                                            color="warning"
                                                            onDelete={() => handleMarkForFollowUp(msg.id, msg.isForFollowUp)}
                                                            deleteIcon={<CloseIcon sx={{ fontSize: '14px !important', color: 'warning.dark' }} />}
                                                            sx={{
                                                                fontSize: '0.65rem',
                                                                height: 16,
                                                                '& .MuiChip-label': { px: 0.6, py: 0 },
                                                                '& .MuiChip-deleteIcon': {
                                                                    fontSize: '14px',
                                                                    marginLeft: '2px',
                                                                    marginRight: '0px',
                                                                    color: 'error.main',
                                                                    '&:hover': {
                                                                        color: 'error.dark',
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() => handleMarkForFollowUp(msg.id, msg.isForFollowUp)}
                                                            sx={{
                                                                fontSize: '0.65rem',
                                                                py: 0.15,
                                                                px: 0.7,
                                                                minWidth: 'auto',
                                                                lineHeight: 1.2,
                                                                borderRadius: 1.5,
                                                                height: 16,
                                                                borderColor: 'grey.400',
                                                                color: 'text.secondary',
                                                                '&:hover': {
                                                                    borderColor: 'primary.main',
                                                                    bgcolor: 'action.hover'
                                                                }
                                                            }}
                                                        >
                                                            סמן לטיפול
                                                        </Button>
                                                    )}
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
                            <SendIcon sx={{ transform: "rotate(180deg)" }} />
                        )}
                    </IconButton>
                </Stack>
            </Paper>
        </Box>
    );
};

export default ChatWindow;
