import React from 'react';

// material-ui
import {
    Table,
    TableRow,
    TableBody,
    Stack,
    Grid,
    Typography,
    ButtonGroup,
    Button,
    TablePagination,
    Tooltip,
    IconButton
} from '@mui/material';


const Header = ({ title, actions, count, countForPagination, rowsPerPage, page, setPage, selectedActions, selected, setSelected }) => {

    const pagination = countForPagination > rowsPerPage ? true : false;

    const actionDisabled = (action) => {
        if (action.disabled) {
            if (typeof action.disabled === 'function') {
                if (action.disabled()) {
                    return true;
                } else {
                    return false;
                }
            }
        }
        return action.disabled;
    }

    return (
        <Grid container spacing={2} alignItems="center" sx={{ py: pagination ? 0 : 1 }}>
            <Grid item xs={3}>
                <Typography variant="h5">
                    {title}
                    {count && <>&nbsp;<Typography variant="caption">({count})</Typography></>}
                </Typography>
            </Grid>
            <Grid item xs={pagination ? 5 : 9}>
                <Stack direction="row"
                    justifyContent={pagination ? "center" : "end"}
                    alignItems="center"
                    spacing={2}>
                    {(actions) && <ButtonGroup size='small'>
                        {actions.map((action, index) => {

                            const btn = action.icon && action.label == undefined
                                ? <IconButton
                                    key={index}
                                    color="primary"
                                    disabled={actionDisabled(action)}
                                    onClick={action.onClick}
                                >
                                    {action.icon}
                                </IconButton>
                                : <Button
                                    key={index}
                                    variant="outlined"
                                    color="primary"
                                    disabled={actionDisabled(action)}
                                    onClick={action.onClick}
                                    endIcon={action.icon ? action.icon : null}
                                >
                                    {action.label}
                                </Button>

                            return (
                                <React.Fragment key={index}>
                                    {(action.tooltip && !actionDisabled(action)) && <Tooltip title={action.tooltip} arrow>
                                        {btn}
                                    </Tooltip>}
                                    {(!action.tooltip || actionDisabled(action)) && btn}
                                </React.Fragment>
                            )
                        })}
                    </ButtonGroup>}
                    {(selectedActions && selected.length > 0) && <ButtonGroup size='small'>
                        {selectedActions.map((action, index) => {

                            const btn = action.icon && action.label == undefined
                                ? <IconButton
                                    key={index}
                                    color="primary"
                                    disabled={actionDisabled(action)}
                                    onClick={action.onClick}
                                >
                                    {action.icon}
                                </IconButton>
                                : <Button
                                    key={index}
                                    variant="outlined"
                                    color="primary"
                                    disabled={actionDisabled(action)}
                                    onClick={() => action.onClick({ selected, setSelected })}
                                    endIcon={action.icon ? action.icon : null}
                                >
                                    {action.label}
                                </Button>

                            return (
                                <React.Fragment key={index}>
                                    {(action.tooltip && !actionDisabled(action)) && <Tooltip title={action.tooltip} arrow>
                                        {btn}
                                    </Tooltip>}
                                    {(!action.tooltip || actionDisabled(action)) && btn}
                                </React.Fragment>
                            )
                        })}
                    </ButtonGroup>}
                </Stack>
            </Grid>
            {pagination && <Grid item xs={4}>
                <Table sx={{ p: 0, m: 0 }}>
                    <TableBody sx={{ p: 0, m: 0 }}>
                        <TableRow sx={{ p: 0, m: 0 }}>
                            <TablePagination
                                sx={{ p: 0, m: 0 }}
                                count={countForPagination}
                                onPageChange={(e, p) => setPage(p)}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                rowsPerPageOptions={[rowsPerPage]}
                                showFirstButton
                                showLastButton
                                labelDisplayedRows={({ from, to, count }) => { return `${from}–${to} מתוך ${count !== -1 ? count : `more than ${to}`}`; }}
                            />
                        </TableRow>
                    </TableBody>
                </Table>
            </Grid>}
        </Grid>
    );
}

export default Header;