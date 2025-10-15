import React, { useState, useEffect } from "react";
import { Card, Grid, Box, IconButton, Tooltip, Typography } from "@mui/material";
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { useQuery } from "react-query";
import MessageTypeSidebar from './components/MessageTypeSidebar';
import ContactsList from './components/ContactsList';
import ChatWindow from './components/ChatWindow';
import { getAllConversations } from '../../api/services/conversations';

const VoiceMsg = () => {
    const [selectedType, setSelectedType] = useState('messages');
    const [selectedContact, setSelectedContact] = useState(null);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        const saved = localStorage.getItem('voiceMsg_notifications_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [lastMessageCount, setLastMessageCount] = useState(0);

    // פונקציה לבקשת הרשאות נוטיפיקציות
    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            return permission;
        }
        return 'denied';
    };

    // פונקציה להצגת נוטיפיקציה
    const showNotification = (title, options = {}) => {
        if (notificationPermission === 'granted' && notificationsEnabled) {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/logo192.png',
                requireInteraction: true,
                ...options
            });

            // סגירה אוטומטית אחרי 8 שניות
            setTimeout(() => {
                notification.close();
            }, 8000);

            // פוקוס על החלון כשלוחצים על הנוטיפיקציה
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        }
    };

    // מעקב אחר הודעות חדשות
    const { data: allConversations = [] } = useQuery(
        'allConversations',
        getAllConversations,
        {
            refetchInterval: 10000,
            onSuccess: (conversations) => {
                if (conversations && conversations.length > 0) {
                    // ספירת הודעות לא נקראות
                    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCountBySystem || 0), 0);
                    
                    // בדיקה אם יש הודעות חדשות והדף לא פעיל
                    if (totalUnread > lastMessageCount && lastMessageCount > 0 && document.hidden) {
                        const newMessages = totalUnread - lastMessageCount;
                        showNotification(
                            `${newMessages} הודעות חדשות`,
                            {
                                body: 'יש לך הודעות חדשות ממערכת ההודעות הקוליות',
                                tag: 'new-messages-general'
                            }
                        );
                    }
                    
                    setLastMessageCount(totalUnread);
                }
            }
        }
    );

    // בקשת הרשאות בעת טעינת הקומפוננטה
    useEffect(() => {
        if (notificationPermission === 'default' && notificationsEnabled) {
            requestNotificationPermission();
        }
    }, [notificationPermission, notificationsEnabled]);

    // שמירת העדפות נוטיפיקציות
    useEffect(() => {
        localStorage.setItem('voiceMsg_notifications_enabled', JSON.stringify(notificationsEnabled));
    }, [notificationsEnabled]);

    const toggleNotifications = () => {
        if (notificationPermission === 'denied') {
            alert('נוטיפיקציות חסומות. אנא אפשר אותן בהגדרות הדפדפן');
            return;
        }
        
        if (notificationPermission === 'default' && !notificationsEnabled) {
            requestNotificationPermission().then((permission) => {
                if (permission === 'granted') {
                    setNotificationsEnabled(true);
                }
            });
        } else {
            setNotificationsEnabled(!notificationsEnabled);
        }
    };

    const handleTypeSelect = (typeId) => {
        setSelectedType(typeId);
        // ניתן להוסיף כאן לוגיקה לטעינת אנשי קשר לפי סוג ההודעה
    };

    const handleContactSelect = (contactId) => {
        setSelectedContact(contactId);
        // ניתן להוסיף כאן לוגיקה לטעינת ההודעות עם איש הקשר הנבחר
    };

    return (
        <Card sx={{ width: 1, height: "85vh", overflow: 'hidden' }}>
            <Grid container sx={{ height: 1 }} spacing={0}>
                {/* עמודת סוגי הודעות */}
                <Grid item xs={2.5} sx={{ 
                    height: 1, 
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <Box sx={{ flexGrow: 1 }}>
                        <MessageTypeSidebar 
                            selectedType={selectedType}
                            onTypeSelect={handleTypeSelect}
                        />
                    </Box>
                    
                    {/* כפתור נוטיפיקציות בתחתית */}
                    <Box sx={{ 
                        p: 2, 
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper'
                    }}>
                        <Tooltip title={
                            notificationPermission === 'denied' 
                                ? "נוטיפיקציות חסומות - אפשר בהגדרות הדפדפן"
                                : notificationsEnabled 
                                ? "נוטיפיקציות מופעלות - לחץ לביטול"
                                : "נוטיפיקציות מבוטלות - לחץ להפעלה"
                        }>
                            <Box 
                                onClick={toggleNotifications}
                                sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    p: 1,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    bgcolor: notificationsEnabled && notificationPermission === 'granted' 
                                        ? 'success.lighter' 
                                        : 'grey.100',
                                    border: '1px solid',
                                    borderColor: notificationsEnabled && notificationPermission === 'granted' 
                                        ? 'success.main' 
                                        : 'grey.300',
                                    '&:hover': {
                                        bgcolor: notificationsEnabled && notificationPermission === 'granted' 
                                            ? 'success.light' 
                                            : 'grey.200'
                                    }
                                }}
                            >
                                {notificationsEnabled && notificationPermission === 'granted' ? (
                                    <NotificationsIcon 
                                        fontSize="small" 
                                        sx={{ color: 'success.main' }} 
                                    />
                                ) : (
                                    <NotificationsOffIcon 
                                        fontSize="small" 
                                        sx={{ color: notificationPermission === 'denied' ? 'error.main' : 'grey.600' }} 
                                    />
                                )}
                                <Typography variant="caption" sx={{ 
                                    fontSize: '0.75rem',
                                    color: notificationsEnabled && notificationPermission === 'granted' 
                                        ? 'success.dark' 
                                        : notificationPermission === 'denied' 
                                        ? 'error.main' 
                                        : 'grey.600'
                                }}>
                                    {notificationPermission === 'denied' 
                                        ? 'חסום'
                                        : notificationsEnabled 
                                        ? 'התראות'
                                        : 'ללא התראות'
                                    }
                                </Typography>
                            </Box>
                        </Tooltip>
                    </Box>
                </Grid>
                
                {/* עמודת אנשי קשר */}
                <Grid item xs={3.5} sx={{ 
                    height: 1,
                    borderRight: '1px solid',
                    borderColor: 'divider'
                }}>
                    <ContactsList 
                        selectedContact={selectedContact}
                        onContactSelect={handleContactSelect}
                        selectedType={selectedType}
                    />
                </Grid>
                
                {/* עמודת הצ'אט */}
                <Grid item xs={6} sx={{ height: 1 }}>
                    <ChatWindow 
                        selectedContact={selectedContact}
                        selectedType={selectedType}
                    />
                </Grid>
            </Grid>
        </Card>
    );
};

export default VoiceMsg;