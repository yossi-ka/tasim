import { utils, writeFile } from 'xlsx';
import { formatCurrency, formatDate, formatDateTime, isEmpty } from './func'

export function exportExcel(
    data,
    fileName = `export${new Date().getTime()}`,
    term = null,
    shhetName = 'גיליון 1'
) {
    let formatData = data.map((item) => {
        let newItem = {};
        if (term) {
            for (const key in term) {
                if (term.hasOwnProperty(key)) {
                    const element = term[key];
                    if (element.type === 'date') {
                        newItem[element.name] = !item[element.name] ? "" : item[element.name].toDate ? formatDate(item[element.name].toDate()) : formatDate(item[element.name]);
                    } else if (element.type === 'datetime') {
                        newItem[element.name] = formatDateTime(item[element.name]);
                    } else if (element.type === 'currency' || element.type === 'currencyIL') {
                        newItem[element.name] = { v: formatNumber(item[element.name]), t: 'n', z: "#,##0.00" };
                    } else if (element.type === 'percent') {
                        newItem[element.name] = { v: formatNumber(item[element.name]) / 100, t: 'n', z: "0.00%" };
                    } else if (element.type === 'number') {
                        newItem[element.name] = { v: formatNumber(item[element.name]), t: 'n', z: "0" };
                    } else if (element.type === 'boolean') {
                        newItem[element.name] = formatBoolean(item[element.name]);
                    } else if (element.type === 'url') {
                        newItem[element.name] = item[element.name] ? { f: `=HYPERLINK("${item[element.name]}","${element.label}")` } : ''
                    } else {
                        newItem[element.name] = item[element.name];
                    }
                }
            }
        }
        return newItem;
    });

    const ws = utils.json_to_sheet(formatData);


    if (term) {
        for (let index = 0; index < term.length; index++) {
            const element = term[index];
            const columnName = getColumnName(index);
            ws[`${columnName}1`].v = element.label;
        }
    }

    const wb = utils.book_new();
    //set right to left
    if (!wb.Workbook) wb.Workbook = {};
    if (!wb.Workbook.Views) wb.Workbook.Views = [];
    if (!wb.Workbook.Views[0]) wb.Workbook.Views[0] = {};
    wb.Workbook.Views[0].RTL = true;

    utils.book_append_sheet(wb, ws, 'Sheet1');
    writeFile(wb, `${fileName}.xlsx`);
}

function getTypeCell(type) {
    if (type === 'number' || type === 'currency' || type === 'currencyIL' || type === 'percent') {
        return 'n';
    }
    // if (type === 'date') {
    //     return 'd';
    // }
    return 's';
}

function formatNumber(val) {
    let n = Number(val);
    if (isNaN(n) || isEmpty(n)) {
        return 0;
    }
    return n;
}

function formatBoolean(val) {
    const v = "כן";
    const x = "לא";
    if (isEmpty(val)) {
        return "";
    }
    switch (val) {
        case true:
            return v;
        case false:
            return x;
        case 'true':
            return v;
        case 'false':
            return x;
        case 'כן':
            return v;
        case 'לא':
            return x;
        case '1':
            return v;
        case '0':
            return x;
        case 1:
            return v;
        case 0:
            return x;
        default:
            return val;
    }
}

function getColumnName(index) {
    let columnName = '';
    while (index >= 0) {
        columnName = String.fromCharCode((index % 26) + 65) + columnName;
        index = Math.floor(index / 26) - 1;
    }
    return columnName;
}