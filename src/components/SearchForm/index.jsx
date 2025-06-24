import React from 'react';

import { Paper, InputBase, Divider, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchForm = ({ placeholder, onClick }) => {

    const [text, setText] = React.useState('');

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            onClick(text);
        }
    }

    const hendleClick = (e) => {
        onClick(text);
    }

    return (
        <Paper variant='outlined' elevation={0} sx={{ py: 0.3, display: 'flex', alignItems: 'center', width: 1 }}>
            <InputBase
                value={text}
                onChange={(e) => setText(e.target.value)}
                sx={{ ml: 1, flex: 1, width: 0.8 }}
                placeholder={placeholder}
                onKeyDown={handleKeyDown}
            />
            <Divider sx={{ height: 20 }} orientation="vertical" />
            <IconButton onClick={hendleClick} size="small" sx={{ width: 0.15 }}>
                <SearchIcon fontSize='small' />
            </IconButton>
        </Paper>
    )
}

export default SearchForm;