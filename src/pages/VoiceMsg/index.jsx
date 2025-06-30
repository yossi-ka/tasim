import React, { useState } from "react";
import { Card, Grid } from "@mui/material";
import MessageTypeSidebar from './components/MessageTypeSidebar';
import ContactsList from './components/ContactsList';
import ChatWindow from './components/ChatWindow';

const VoiceMsg = () => {
    const [selectedType, setSelectedType] = useState('outgoing');
    const [selectedContact, setSelectedContact] = useState(null);

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
            <Grid container sx={{ height: 1 }}>
                {/* עמודת סוגי הודעות */}
                <Grid item xs={2.5} sx={{ height: 1 }}>
                    <MessageTypeSidebar 
                        selectedType={selectedType}
                        onTypeSelect={handleTypeSelect}
                    />
                </Grid>
                
                {/* עמודת אנשי קשר */}
                <Grid item xs={3.5} sx={{ height: 1 }}>
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