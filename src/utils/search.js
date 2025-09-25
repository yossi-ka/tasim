import { formatDate, isArray, isEmpty, isFunction } from "./func"

export const search = ({ params, data, setData, getLookupName, terms }) => {
    if (!params || Object.keys(params).length === 0) setData(data)
    if (!isArray(data)) return setData()
    if (!isFunction(setData)) return setData()

    const searchParams = { ...params }
    const returnData = data.filter((item) => {

        for (let key in searchParams) {
            if (terms && terms.find((term) => term.name === key)?.cbSearch) {
                const res = terms.find((term) => term.name === key).cbSearch(item, searchParams[key])
                if (!res) return false;
            } else if (key === "globalSearch") {
                const fullRow = getFullRow(item, terms, getLookupName)
                const searchArr = params[key].split(" ")
                let isMatch = true;
                searchArr.forEach((searchWord) => {
                    if (!fullRow.includes(searchWord)) isMatch = false;
                })
                if (!isMatch) return false;

            } else if (key.startsWith("start")) {
                const keyName = key.replace("start", "")
                if (!item[keyName] && item[keyName] !== 0) return false
                if (isArray(terms) && terms.find((term) => term.name === keyName)?.type === "date") {
                    searchParams[key] = new Date(searchParams[key])
                }
                if (item[keyName] < searchParams[key]) {
                    return false;
                }
            } else if (key.startsWith("end")) {
                const keyName = key.replace("end", "")
                if (!item[keyName] && item[keyName] !== 0) return false
                if (isArray(terms) && terms.find((term) => term.name === keyName)?.type === "date") {
                    searchParams[key] = new Date(searchParams[key])
                }
                if (item[keyName] > searchParams[key]) {
                    return false;
                }
            } else if (key.startsWith("contains")) {
                const keyName = key.replace("contains", "")
                let isMatch = false;
                for (let i = 0; i < params[key].length; i++) {
                    if (params[key][i] === 0) {
                        if (isEmpty(item[keyName]) || (isArray(item[keyName]) && item[keyName].length === 0)) {
                            isMatch = true;
                            break;
                        }
                    }
                    if (!item[keyName] || !isArray(item[keyName])) return false;
                    if (item[keyName].includes(params[key][i])) {
                        isMatch = true;
                        break;
                    }
                }
                if (!isMatch) return false;
            } else if (isArray(params[key])) {
                //params === [1,2,3] item === 1
                let isMatch = false;
                for (let i = 0; i < params[key].length; i++) {
                    if (item[key] === params[key][i]) {
                        isMatch = true;
                        break;
                    }
                }
                if (!isMatch) return false;
            } else {
                if (!item[key]) return false
                if (searchParams[key] !== item[key]) {
                    return false;
                }
            }
        }
        return true;
    });
    return setData(returnData);
}

const getFullRow = (data, terms, getLookupName) => {
    const item = { ...data }
    let returnString = "";
    for (let i = 0; i < terms.length; i++) {
        if (terms[i].type === "date") {
            returnString += formatDate(item[terms[i].name]) + " "
        } else if (terms[i].type === "lookup") {
            returnString += getLookupName(terms[i].lookup, item[terms[i].name]) + " "
        } else if (terms[i].type === "lookup-array") {
            returnString += !isArray(item[terms[i].name]) ? '' : item[terms[i].name].map((i) => getLookupName(terms[i]?.lookup, i)).join(" ") + " "
        } else if (terms[i].type === "boolean") {

        } else {
            returnString += item[terms[i].name] + " "
        }
    }
    return returnString;
}


