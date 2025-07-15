import React from 'react';
import GenericTable from '../../components/GenericTable';
import useTerms from '../../terms';
import { useQuery } from 'react-query';
import { getCollectionGroupsHistory } from '../../api/services/collectionGroups';
import { Stack, Typography } from '@mui/material';
import PrintActionsCell from './PrintActionsCell';

const CollectionGroupsHistory = () => {

    const { data, isLoading } = useQuery("collectionGroupsHistory", getCollectionGroupsHistory)

    const term = useTerms("CollectionGroupsHistory");

    const columns = [
        ...term.table(),
        {
            cb: (row) => <PrintActionsCell collectionGroupId={row.id} />,
        }
    ]
    return (
        <>
            <GenericTable
                height="main"
                data={data || []}
                columns={columns}
                title="קבוצות ליקוט - היסטוריה"
                loading={isLoading}
                header={<Typography>בהמשך יהיה כאן סיכומים של כמות הזמנות ומוצרים</Typography>}
            />
        </>
    );
}

export default CollectionGroupsHistory;