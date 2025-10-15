export const data = [
    { code: 'nedarim', name: "נדרים פלוס", tableCode: 'registrationSource' },
    { code: 'yemot', name: "טלפון", tableCode: 'registrationSource' },
    { code: 'web', name: "אתר", tableCode: 'registrationSource' },

]


export const getLookup = (lookupName, parentID = null) => {
    let arr = [];
    data.map(lookup => {
        if (lookup.tableCode === lookupName) {
            if (parentID) {
                if (lookup.parentID == parentID) {
                    arr.push({ value: lookup.code, label: lookup.name });
                }
            } else {
                arr.push({ value: lookup.code, label: lookup.name });
            }
        }
    });
    return arr;
}

