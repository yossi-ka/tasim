import React from 'react';
import {
    Table,
    TableRow,
    TableBody,
    Grid,
    TablePagination,
} from '@mui/material';

import MySwitch from '../../global/MySwitch';


const Footer = ({ count, countForPagination, rowsPerPage, page, setPage, isDense, setIsDense }) => {

    const pagination = countForPagination > rowsPerPage ? true : false;

    return (
        <Grid container spacing={2} alignItems="center" sx={{ px: 3, py: 0.5 }}>

            <Grid item xs={pagination ? 8 : 12}>
                <MySwitch
                    label="תצוגה מצומצמת"
                    checked={isDense}
                    onChange={(e) => setIsDense(e.target.checked)}
                />
            </Grid>
            {pagination && <Grid item xs={4}>
                <Table>
                    <TableBody>
                        <TableRow >
                            <TablePagination
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
export default Footer;