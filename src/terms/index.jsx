import React from "react";

import Terms from "./Terms";

function useTerms(_terms = 'General') {
    
    let terms = React.useMemo(() => {
        return new Terms(_terms);
    }, [_terms]);
    
    return terms;
}

export default useTerms;