import React from "react";
import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader,
    Typography,
    Box
} from "@mui/material";
import { useQuery } from "react-query";
import SendIcon from '@mui/icons-material/Send';
import DraftsIcon from '@mui/icons-material/Drafts';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import InboxIcon from '@mui/icons-material/Inbox';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ForumIcon from '@mui/icons-material/Forum';
import { getMessagesCounts } from '../../../api/services/conversations';


const MessageTypeSidebar = ({ selectedType, onTypeSelect }) => {
    
    // קבלת מספר ההודעות
    const { data: messageCounts = { messages: 0, pending: 0 }, refetch: refetchCounts } = useQuery(
        'messageCounts',
        getMessagesCounts,
        {
            refetchInterval: 30000, // רענון כל 30 שניות
            staleTime: 10000 // הנתונים נחשבים טריים ל-10 שניות
        }
    );

    const messageTypes = [

        {
            id: 'messages',
            label: 'הודעות',
            icon: <ForumIcon />
        },
        {
            id: 'pending',
            label: 'הודעות לטיפול',
            icon: <PendingActionsIcon />
        },
        // {
        //     id: 'drafts',
        //     label: 'טיוטות',
        //     icon: <DraftsIcon />,
        //     disabled: true
        // },
        // {
        //     id: 'contacts',
        //     label: 'אנשי קשר',
        //     icon: <ContactPhoneIcon />,
        //     disabled: true
        // },
        // {
        //     id: 'voice',
        //     label: 'הודעות קוליות',
        //     icon: <RecordVoiceOverIcon />,
        //     disabled: true
        // }
    ];

    return (
        <List
            sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'background.paper'
            }}
            component="nav"
            aria-labelledby="message-type-subheader"
            subheader={
                <ListSubheader
                    component="div"
                    id="message-type-subheader"
                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
                >
                    שירות לקוחות
                </ListSubheader>
            }
        >
            {messageTypes.map((type) => (
                <ListItemButton
                    key={type.id}
                    selected={selectedType === type.id}
                    onClick={() => onTypeSelect(type.id)}
                    disabled={type.disabled}
                    sx={{
                        '&.Mui-selected': {
                            bgcolor: 'primary.lighter',
                            '&:hover': {
                                bgcolor: 'primary.light',
                            },
                        },
                    }}
                >
                    <ListItemIcon>
                        {type.icon}
                    </ListItemIcon>
                    <ListItemText primary={type.label} />
                    {/* מספר ההודעות בקצה השורה */}
                    <Box sx={{ mr: 1 }}>
                        {(() => {
                            const count = type.id === 'messages' 
                                ? messageCounts.messages 
                                : type.id === 'pending' 
                                    ? messageCounts.pending 
                                    : 0;
                            
                            return count > 0 ? (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        bgcolor: type.id === 'pending' && count > 0 ? 'warning.main' : 'primary.main',
                                        color: 'white',
                                        px: 1,
                                        py: 0.3,
                                        borderRadius: 2,
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        minWidth: '20px',
                                        textAlign: 'center',
                                        display: 'inline-block'
                                    }}
                                >
                                    {count > 99 ? '99+' : count}
                                </Typography>
                            ) : null;
                        })()}
                    </Box>
                </ListItemButton>
            ))}
        </List>
    );
};

export default MessageTypeSidebar;
