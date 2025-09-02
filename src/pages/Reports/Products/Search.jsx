import RefreshIcon from '@mui/icons-material/Refresh';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import GlobalSearch from "../../../global/GlobalSearch";

const Search = ({ refetch, params, setParams,setDateRange }) => {
    return <GlobalSearch
        quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
        quickSearchOnTyping={true}
        params={params}
        setParams={setParams}
        actions={[
            {
                title: "איפוס טווח תאריכים",
                icon: <EventRepeatIcon color='primary' />,
                onClick: () => setDateRange({ startDate: null, endDate: null })
            },
            {
                title: "רענן מסך",
                icon: <RefreshIcon color='primary' />,
                onClick: () => {
                    refetch();
                }
            },
        ]}
    />
}

export default Search;
