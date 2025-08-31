import GlobalSearch from "../../global/GlobalSearch";

const Search = ({ 
    params, 
    setParams, 
    allColumns, 

}) => {
    console.log(allColumns);

    return <>
        <GlobalSearch
            quickSearchFields={[{ name: 'globalSearch', label: 'חיפוש כללי', size: 12, variant: "outlined" }]}
            quickSearchOnTyping={true}
            params={params}
            setParams={setParams}
        />
    </>
}

export default Search;