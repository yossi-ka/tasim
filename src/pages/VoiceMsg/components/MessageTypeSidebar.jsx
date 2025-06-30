import React from "react";
import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    ListSubheader
} from "@mui/material";
import SendIcon from '@mui/icons-material/Send';
import DraftsIcon from '@mui/icons-material/Drafts';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import InboxIcon from '@mui/icons-material/Inbox';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

const MessageTypeSidebar = ({ selectedType, onTypeSelect }) => {
    const messageTypes = [
        {
            id: 'incoming',
            label: 'הודעות נכנסות',
            icon: <InboxIcon />,
            disabled: true
        },
        {
            id: 'outgoing',
            label: 'הודעות יוצאות',
            icon: <SendIcon />
        },
        {
            id: 'pending',
            label: 'הודעות לטיפול',
            icon: <PendingActionsIcon />,
            disabled: true
        },
        {
            id: 'drafts',
            label: 'טיוטות',
            icon: <DraftsIcon />,
            disabled: true
        },
        {
            id: 'contacts',
            label: 'אנשי קשר',
            icon: <ContactPhoneIcon />,
            disabled: true
        },
        {
            id: 'voice',
            label: 'הודעות קוליות',
            icon: <RecordVoiceOverIcon />,
            disabled: true
        }
    ];

    return (
        <List
            sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider'
            }}
            component="nav"
            aria-labelledby="message-type-subheader"
            subheader={
                <ListSubheader
                    component="div"
                    id="message-type-subheader"
                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
                >
                    סוגי הודעות
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
                </ListItemButton>
            ))}
        </List>
    );
};

export default MessageTypeSidebar;
