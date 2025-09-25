import React from 'react';

import { useQueryClient } from 'react-query';

import { useLocation } from 'react-router-dom';

import { Box, Collapse } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

import useTerms from '../../terms';
import Context from '../../context';
import GenericForm from '../../components/GenericForm';
import { formatDate, formatDateJS, } from '../../utils/func';
import Params from './Params';

const GlobalSearch = ({ fields, params, setParams, quickSearchFields, quickSearchOnTyping, term, header, actions, reactQueryKeys,
    idSessionStorage, isSaveToSessionStorage, withLines, cb, defaultOpen }) => {

    const [collapseOpen, setCollapseOpen] = React.useState(defaultOpen);
    const [initInputs, setInitInputs] = React.useState({});

    const location = useLocation();

    const terms = useTerms(term);
    const { popup, closePopup, getLookupName } = React.useContext(Context);

    const queryClient = useQueryClient();

    //sessionStorage
    const sessionStoragePath = React.useMemo(() => `${location.pathname + idSessionStorage}`, [location.pathname, idSessionStorage]);

    const saveToSessionStorage = ({ params }) => {
        if (!isSaveToSessionStorage) return;
        if (params) sessionStorage.setItem(sessionStoragePath, JSON.stringify(params));
    }

    const arrSessionStorage = React.useMemo(() => {
        return [
            { name: sessionStoragePath, setState: (e) => setParams(e) },
        ]
    }, [sessionStoragePath, setParams]);

    const clearSessionStorage = () => {
        for (let i = 0; i < arrSessionStorage.length; i++) {
            sessionStorage.removeItem(arrSessionStorage[i].name);
        }
    }

    React.useEffect(() => {
        if (!isSaveToSessionStorage) return;
        for (let i = 0; i < arrSessionStorage.length; i++) {
            const params = sessionStorage.getItem(arrSessionStorage[i].name);
            if (params) {
                arrSessionStorage[i].setState(JSON.parse(params))
            }
        }
    }, [sessionStoragePath, isSaveToSessionStorage]);
    //--end sessionStorage

    React.useEffect(() => {
        setInitInputs(params);
    }, [params]);

    const valueToDisplay = React.useCallback((key) => {

        let obj = fields.find(field => field.name === key);


        let type;
        if (obj) type = obj.type || '';

        if (!obj && quickSearchFields.length > 0 && quickSearchFields.find(field => field.name === key)) {
            obj = quickSearchFields.find(field => field.name === key);
            type = obj.type || '';
        }

        if (type === 'date') {
            return formatDate(params[key]);
        } else if (type === 'select') {
            return params[key] ? obj.options.find(option => option.value === params[key]).label : '';
        } else if (type === 'lookup') {
            return params[key] ? getLookupName(obj.lookup, params[key]) : '';
        } else if (type === 'lookupMulti') {
            return params[key] ? params[key].map(id => getLookupName(obj.lookup, id)).join(', ') : '';
        } else if (type === 'checkbox') {
            return params[key] ? "כן" : "לא";
        } else {
            return params[key];
        }

    }, [params, fields, quickSearchFields]);




    const onSubmit = (inputs = null) => {
        const newParams = inputs === null ? { ...initInputs } : inputs;

        Object.keys(newParams).forEach(key => {
            if (newParams[key] instanceof Date) {
                newParams[key] = formatDateJS(newParams[key]);
            }
        });
        saveToSessionStorage({ params: newParams });
        setParams(newParams);
        setCollapseOpen(false)
        if (cb && cb.search && cb.search.onSubmit) cb.search.onSubmit({ params: newParams, setParams });
    }

    const onChoose = (row, keys, setCb, sessionName) => {
        const newInitInputs = { ...initInputs };
        newInitInputs[keys[0]] = row[keys[1]];
        setParams(newInitInputs);
        setCollapseOpen(false);
        setCb(row);
        saveToSessionStorage({ params: newInitInputs, [sessionName]: row });
        closePopup();
    }

    return (
        <Box sx={{ width: 1, height: 1 }}>
            <Params
                setCollapseOpen={setCollapseOpen}
                quickSearchFields={quickSearchFields}
                quickSearchOnTyping={quickSearchOnTyping}
                header={header}
                cb={cb}
                actions={actions}
                initInputs={initInputs}
                setInitInputs={setInitInputs}
                params={params}
                setParams={setParams}
                valueToDisplay={valueToDisplay}
                saveToSessionStorage={saveToSessionStorage}
                onSubmit={onSubmit}
                terms={terms}
            />
            <Collapse in={collapseOpen}>
                <GenericForm
                    isEnterPress={true}
                    fields={[
                        { type: 'line' },
                        ...fields,
                        { type: 'line', displayConditionGrid: () => withLines },
                        {
                            type: "submit",
                            size: 1,
                            label: "חיפוש",
                            variant: "contained",
                            inputSize: withLines ? "large" : "medium",
                            icon: <SearchIcon />,
                        },
                        {
                            type: "button",
                            size: 1,
                            label: "ניקוי חיפוש",
                            icon: <DeleteIcon />,
                            inputSize: withLines ? "large" : "medium",
                            color: "error",
                            onClick: () => {
                                setInitInputs({});
                                setParams({});
                                clearSessionStorage();
                                reactQueryKeys.forEach(key => queryClient.invalidateQueries(key));
                            },
                            displayConditionGrid: (inputs) => Object.keys(inputs).length > 0
                        }
                    ]}
                    initInputs={initInputs}
                    setInitInput={setInitInputs}
                    onSubmit={(inputs) => {
                        onSubmit(inputs);
                    }}
                />
            </Collapse>
        </Box>
    )
}

// default props
GlobalSearch.defaultProps = {
    fields: [],
    setParams: () => { },
    term: "",
    actions: null,
    reactQueryKeys: [],
    idSessionStorage: '',
    withLines: true,
    isSaveToSessionStorage: false,
    cb: null,
    defaultOpen: false,
    quickSearchFields: [],
    quickSearchOnTyping: false,
}

export default GlobalSearch;





