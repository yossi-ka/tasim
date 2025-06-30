import React, { useState, useMemo, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
    List,
    ListItemButton,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Box,
    Badge,
    ListSubheader,
    Chip,
    TextField,
    InputAdornment,
    CircularProgress,
    IconButton
} from "@mui/material";
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { getAllConversations, getConversationsWithPendingMessages } from '../../../api/services/conversations';
import AddContacts from "./AddContacts";
import Context from "../../../context";

const ContactsList = ({ selectedContact, onContactSelect, selectedType }) => {

    const { popup } = useContext(Context)
    const [searchTerm, setSearchTerm] = useState('');

    // קבלת נתוני השיחות לפי הסוג הנבחר
    const getConversationsQuery = () => {
        if (selectedType === 'pending') {
            return "pendingConversations";
        }
        return "allConversations";
    };

    const getConversationsFunction = () => {
        if (selectedType === 'pending') {
            return getConversationsWithPendingMessages;
        }
        return getAllConversations;
    };

    const { data: conversations = [], status, refetch } = useQuery(
        getConversationsQuery(),
        getConversationsFunction()
    );

    // המרת הנתונים למבנה שהקובץ מצפה לו
    const contacts = useMemo(() => {
        return conversations.map(conv => ({
            id: conv.id,
            name: conv.customerName || `טלפון ${conv.phone}`,
            lastMessage: conv.lastMessage?.message || '',
            timestamp: conv.timestamp,
            unreadCount: conv.unreadCountBySystem || 0,
            isOnline: conv.isOnline || false,
            hasPendingMessages: conv.hasPendingMessages || false,
            customerId: conv.customerId,
            phone: conv.phone
        }));
    }, [conversations]);

    // סינון אנשי קשר לפי סוג ההודעה וחיפוש
    const filteredContacts = useMemo(() => {
        let filtered = contacts;

        // סינון לפי סוג הודעה
        if (selectedType === 'pending') {
            filtered = contacts.filter(contact => contact.hasPendingMessages);
        }

        // סינון לפי חיפוש
        if (searchTerm.trim()) {
            filtered = filtered.filter(contact =>
                contact.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        return filtered;
    }, [contacts, selectedType, searchTerm]);

    const getHeaderTitle = () => {
        switch (selectedType) {
            case 'pending':
                return 'הודעות לטיפול';
            case 'incoming':
                return 'הודעות נכנסות';
            case 'outgoing':
                return 'הודעות יוצאות';
            default:
                return 'אנשי קשר';
        }
    };

    // הצגת לודר במהלך טעינה
    if (status === 'loading') {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
            }}>
                <CircularProgress />
            </Box>
        );
    }

    // הצגת שגיאה אם יש
    if (status === 'error') {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                flexDirection: 'column',
                gap: 2
            }}>
                <Typography variant="h6" color="error">
                    שגיאה בטעינת השיחות
                </Typography>
                <Chip
                    label="נסה שוב"
                    onClick={() => refetch()}
                    color="primary"
                    clickable
                />
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* שדה חיפוש */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="חיפוש איש קשר..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                        }
                    }}
                />
            </Box>

            <List
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.paper',
                    borderRight: 1,
                    borderColor: 'divider',
                    overflow: 'auto'
                }}
                subheader={
                    <ListSubheader
                        component="div"
                        sx={{
                            bgcolor: 'secondary.main',
                            color: 'secondary.contrastText',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="subtitle1">{getHeaderTitle()}</Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                                label={filteredContacts.length}
                                size="small"
                                color="primary"
                                variant="outlined"
                            />
                            <IconButton
                                size="small"
                                onClick={() => popup({
                                    title: "הוסף איש קשר חדש",
                                    content: <AddContacts refetch={refetch} onContactSelect={onContactSelect} />,
                                })}
                                sx={{
                                    color: 'secondary.contrastText',
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                }}
                                title="הוסף איש קשר חדש"
                            >
                                <AddIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </ListSubheader>
                }
            >
                {filteredContacts.map((contact) => (
                    <ListItemButton
                        key={contact.id}
                        selected={selectedContact === contact.id}
                        onClick={() => onContactSelect(contact.id)}
                        sx={{
                            borderRadius: 1,
                            mx: 0.5,
                            mb: 0.5,
                            '&.Mui-selected': {
                                bgcolor: 'secondary.lighter',
                                '&:hover': {
                                    bgcolor: 'secondary.light',
                                },
                            },
                        }}
                    >
                        <ListItemAvatar>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                                color={contact.isOnline ? 'success' : 'default'}
                            >
                                <Avatar>
                                    <PersonIcon />
                                </Avatar>
                            </Badge>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle2" noWrap>
                                            {contact.name}
                                        </Typography>
                                        {contact.hasPendingMessages && (
                                            <Chip
                                                label="לטיפול"
                                                size="small"
                                                color="warning"
                                                sx={{ fontSize: '0.65rem', height: 18 }}
                                            />
                                        )}
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="caption" color="text.secondary">
                                            {contact.timestamp}
                                        </Typography>
                                        {contact.unreadCount > 0 && (
                                            <Badge
                                                badgeContent={contact.unreadCount}
                                                color="primary"
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        fontSize: '0.7rem',
                                                        minWidth: '18px',
                                                        height: '18px'
                                                    }
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            }
                            secondary={
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    noWrap
                                    sx={{ mt: 0.5 }}
                                >
                                    {contact.lastMessage}
                                </Typography>
                            }
                        />
                    </ListItemButton>
                ))}

                {filteredContacts.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'לא נמצאו תוצאות חיפוש' : 'אין אנשי קשר'}
                        </Typography>
                    </Box>
                )}
            </List>
        </Box>
    );
};

export default ContactsList;
