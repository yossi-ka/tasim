import React from 'react';

import { Tabs, Tab, Typography, Stack, Chip, ButtonGroup, Button } from '@mui/material'
import { useTheme } from '@mui/material/styles';

const StatusFilter = ({ statuses, statusBarHandleChange, title, isData, count, actions }) => {

  const theme = useTheme();

  const [value, setValue] = React.useState(0);
  const [list, setList] = React.useState([]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    statusBarHandleChange(newValue, list[newValue].key);
  };

  React.useEffect(() => {
    if (!statuses || statuses.length === 0) return;
    const newList = [
      ...statuses
    ];
    setList(newList);
  }, [statuses]);

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ width: 1, bgcolor: theme.palette.grey[100] }}
    >
      {title && typeof title == "string" ? <Typography variant='h4' sx={{ px: 3, py: 1, fontWeight: 600 }}>
        {title}
        {count > 0 && <span style={{ fontSize: '14px' }}> ({count})</span>}
      </Typography> : title}

      {actions && <ButtonGroup color='primary' variant="outlined" sx={{ mx: 2 }}>
        {actions.map((action, index) => <Button
          onClick={action.onClick ? () => action.onClick() : null}
          disabled={action.disabled} key={index}>
          <Stack direction='row' spacing={1} alignItems='center'>
            <Typography variant='body1' sx={{ fontWeight: 600 }}>
              {action.label || ''}
            </Typography>
            {action.count && <Chip label={action.count} size="small" color="primary" />}
          </Stack>
        </Button>)}
      </ButtonGroup>}

      {(statuses) && <Tabs value={value} onChange={handleChange}>
        {list.map((status, index) => <Tab
          key={index}
          sx={{ width: 140 }}
          label={<Stack direction='row' spacing={1} alignItems='center'>
            <Chip
              label={status.count}
              size='small'
              sx={{
                bgcolor: theme.palette[status.color][100],
                color: theme.palette[status.color][700]
              }}
            />
            <Typography variant='body2' sx={{
              fontWeight: 600,
            }}>
              {status.label}
            </Typography>
          </Stack>}
        />)}
      </Tabs>}
    </Stack>
  )
}

export default StatusFilter;