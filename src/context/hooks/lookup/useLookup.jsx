import React from "react";
import { useQuery } from "react-query";

import http from "../../../api/http";
import { data } from './data'

function useLookup() {

    // const isError = false, isLoading = false;

    // const { data, isError, isLoading } = useQuery(
    //     ['lookup'],
    //     async () => await http.get("getLookup"),
    // );


    // console.log("Lookup", lookup.status, lookup.data, lookup.error)
    // if (isError) {
    //     console.log("Lookup Error", isError);
    // }
    const getLookup = (lookupName, parentID = null) => {
        if (!data) return [];
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

    const getLookupName = (lookupName, code) => {
        let name = "";
        let singel = data.find(lookup => lookup.tableCode === lookupName && lookup.code == code);
        if (singel) name = singel.name;
        return name;
    }

    const getLookupCode = (lookupName, name) => {
        let code = -1;
        let singel = data.find(lookup => lookup.tableCode === lookupName && lookup.name == name);
        if (singel) code = singel.code;
        return code;
    }

    const convertArray = (arr, term) => {
        let formatData = arr.map((item) => {
            let newItem = {};
            if (term) {
                for (const key in term) {
                    if (term.hasOwnProperty(key)) {
                        const element = term[key];
                        if (element.type === 'lookup') {
                            newItem[element.name] = getLookupName(element.lookup, item[element.name]);
                        } else {
                            newItem[element.name] = item[element.name];
                        }
                    }
                }
            }
            return newItem;
        });
        return formatData;
    }

    return {
        getLookup,
        getLookupName,
        getLookupCode,
        lookupIsLoading: false,
        convertArray
    };
}
export default useLookup;