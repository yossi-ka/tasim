//generate a random number between min and max
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getDateTimeFromNow(obj = {}, fixed = null, _now = null) {

    let now = _now
        ? new Date(_now)
        : new Date()

    let year = obj.year ? obj.year : 0;
    let month = obj.month ? obj.month : 0;
    let day = obj.day ? obj.day : 0;
    let hour = obj.hour ? obj.hour : 0;
    let minute = obj.minute ? obj.minute : 0;
    let second = obj.second ? obj.second : 0;

    let date = new Date(now.getFullYear() + year, now.getMonth() + month, now.getDate() + day, now.getHours() + hour, now.getMinutes() + minute, now.getSeconds() + second);

    if (fixed) {
        let fixedYear = fixed.year ? fixed.year : date.getFullYear();
        let fixedMonth = fixed.month ? fixed.month - 1 : date.getMonth();
        let fixedDay = fixed.day ? fixed.day : date.getDate();
        let fixedHour = fixed.hour ? fixed.hour : date.getHours();
        let fixedMinute = fixed.minute ? fixed.minute : date.getMinutes();
        let fixedSecond = fixed.second ? fixed.second : date.getSeconds();

        date = new Date(fixedYear, fixedMonth, fixedDay, fixedHour, fixedMinute, fixedSecond);
    }

    return date;

}

export function formatDateJS(_date = null) {

    const date = _date ? new Date(_date) : new Date();

    // console.log(date.getTime());

    // if (date.getTime() < 0) {
    //     return null;
    // }

    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = '' + date.getFullYear();

    // if (year < 1000) year = 1000;

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    // day = day.padStart(2, "0");
    // month = month.padStart(2, "0");
    year = year.padStart(4, "0");
    return [year, month, day].join('-');

}

export function formatDateLiav(_date = null) {

    const date = _date ? new Date(_date) : new Date();

    // if (date.getTime() < 0) {
    //     return null;
    // }

    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();

    // if (year < 1000) year = 1000;

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('');

}

export function checkDate(date) {
    let parseDate = null;
    let dateArr = date.split('/');
    if (dateArr.length !== 3) {
        dateArr = date.split('-');
    }
    //is dd/mm/yyyy
    else {
        parseDate = new Date(`${dateArr[1]}/${dateArr[0]}/${dateArr[2]}`);
        return parseDate != 'Invalid Date' ? parseDate : null;
    }
    if (dateArr.length !== 3) return null;
    //is yyyy-mm-dd
    parseDate = new Date(`${dateArr[1]}/${dateArr[2]}/${dateArr[0]}`);

    return parseDate != 'Invalid Date' ? parseDate : null;
}

//format a date
export function formatDate(_date = null) {

    const date = _date ? new Date(_date) : new Date();

    // if invalid date
    if (date == 'Invalid Date') return;

    if (date.getTime() == -62135605254000) {
        return;
    }


    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('/');

}

export function convertDateILtoJS(date) {
    return date.split('/').reverse().join('-');
}

// convert yyyy-mm-dd to dd/mm/yyyy
export function convertDateJsToIL(date) {
    return date.split('-').reverse().join('/');
}

export function formatMonth(_date = null) {
    const date = _date ? new Date(_date) : new Date();

    let month = '' + (date.getMonth() + 1);
    let year = date.getFullYear();

    if (month.length < 2) month = '0' + month;

    return [month, year].join('/');
}

export function formatMonthJS(_date = null) {
    const date = _date ? new Date(_date) : new Date();

    let month = '' + (date.getMonth() + 1);
    let year = date.getFullYear();

    if (month.length < 2) month = '0' + month;

    return [year, month].join('-');
}

export function formatDateTime(_date = null) {

    const date = _date ? new Date(_date) : new Date();

    let month = '' + (date.getMonth() + 1);
    let day = '' + date.getDate();
    let year = date.getFullYear();

    let hour = '' + date.getHours();
    let minute = '' + date.getMinutes();
    let second = '' + date.getSeconds();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    if (hour.length < 2) hour = '0' + hour;
    if (minute.length < 2) minute = '0' + minute;
    if (second.length < 2) second = '0' + second;

    return [day, month, year].join('/') + ' ' + [hour, minute, second].join(':');
}

//convert date from excel to Date obj;
export function excelDateToJSDate(excelDate) {
    // Excel stores dates as the number of days since January 1, 1900
    // JavaScript stores dates as the number of milliseconds since January 1, 1970
    var millisecondsPerDay = 24 * 60 * 60 * 1000;
    var dateOffset = (excelDate - 25569) * millisecondsPerDay;
    var jsDate = new Date(dateOffset);
    return jsDate;
}

export function formatCurrency(value, toFixed = 2) {
    if (value === null || value === undefined || value === '' || isNaN(value)) value = 0;
    value = parseFloat(value).toFixed(toFixed);
    // if is negative number then add '-' sign
    if (value < 0) {
        value = value * -1;
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + '-';
    } else {
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

}
export function formatNumber(value, fixed = null) {
    if (fixed) value = parseFloat(value).toFixed(fixed);
    let arr = value.toString().split(".");
    return arr[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (arr[1] ? "." + arr[1] : "");
}
export function formatCurrencyIL(value) {
    if (value === null || value === undefined || value === '' || isNaN(value)) value = 0;
    value = parseFloat(value).toFixed(2);
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "\xa0₪";
}
export function formatMinusCurrencyIL(value) {
    if (value === null || value === undefined || value === '' || isNaN(value)) value = 0;
    value = parseFloat(value).toFixed(2);
    // add minus sign before the number
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "-" + "\xa0₪";
}
export function formatPercent(value) {
    if (value === null || value === undefined || value === '' || isNaN(value)) value = 0;
    value = parseFloat(value).toFixed(2);
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "%";
}

// paras object to query string
export function queryString(obj, first = '?') {
    // console.log(obj);
    var str = [];
    for (var p in obj)
        if (obj[p] !== undefined && obj[p] !== null && obj[p] !== '' && obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.length > 0 ? first + str.join("&") : "";
}

export function queryStringV2(_obj, first = '?') {

    var str = [];
    // בלי זה המערכת מוחקת את הסטייט המקורי, לא למחוק !!!!!!!!
    var obj = { ..._obj };
    for (var p in obj)
        if (obj[p] !== undefined && obj[p] !== null && obj[p] !== '' && obj.hasOwnProperty(p)) {
            if (typeof obj[p] === 'boolean') obj[p] = obj[p] ? 1 : 0;
            // if array convert to string
            if (Array.isArray(obj[p])) {
                // loop on array and convert to string
                obj[p] = obj[p].map(item => {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(item));
                });
            } else {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        }
    return str.length > 0 ? first + str.join("&") : "";
}

export function formatReadMore(text, length = 5, space = false) {
    if (!text) return '';
    if (text.length > length) {
        let lastSpace = space ? text.lastIndexOf(' ', length) : length;
        return text.substring(0, lastSpace) + '\xa0...';
    }
    return text;
}
// display the first word of a string with
export function formatReadMoreWord(text) {
    if (!text) return '';
    let arr = text.split(' ');
    if (arr.length > 0) {
        return arr[0] + '\xa0...';
    }
    return text;
}

// convert string to number
export function convertToNumber(value) {
    return parseFloat(value.replace(/,/g, ''));
}

export function isEmpty(value) {
    return value === null || value === undefined || value === '' || value === '0' || value === 0;
}
export function isEmptyWithoutZiro(value) {
    return value === null || value === undefined || value === '';
}

export function isFunction(value) {
    return typeof value === 'function';
}

export function isNumber(value) {
    return /^-?\d*\.?\d*$/.test(value);
}

export function isInteger(value) {
    return /^-?\d*$/.test(value);
}

export function isDateNumber(value) {
    return /^[0-9/]*$/.test(value);
}

export function isPhone(value) {
    return /^[0-9-+]*$/.test(value);
}

export function isBetween(value, min, max) {
    return value >= min && value <= max;
}

export function isObjEmpty(obj) {
    return Object.keys(obj).length === 0;
}

export function isValueEmpty(value) {
    return value === null || value === undefined || value === '';
}

export function isArray(value) {
    return Array.isArray(value);
}

export function checkTeudatZehut(id) {
    if (id === null || id === undefined || id === '') return true;
    id = String(id).trim();
    if (id.length <= 0) return " ";
    if (id.length > 9 || isNaN(id)) return false;
    id = id.length < 9 ? ("00000000" + id).slice(-9) : id;
    const res = Array.from(id, Number).reduce((counter, digit, i) => {
        const step = digit * ((i % 2) + 1);
        return counter + (step > 9 ? step - 9 : step);
    }) % 10 === 0;
    return res;
}

export function checkPhone(phone) {
    if (phone === null || phone === undefined || phone === '') return true;
    phone = phone.toString();
    phone = phone.replaceAll('-', '');
    phone = phone.replaceAll(' ', '');
    if (!(/^\d+$/.test(phone))) return false
    if (phone.length < 7 || phone.length > 10) return false;
    if (phone.length == 7 && phone[0] != 0) phone = '02' + phone;
    if (phone.length == 9 && phone[0] != 0) phone = '0' + phone
    const res = /^0?(([23489]{1}\d{7})|[57]{1}\d{8})$/.test(phone);
    return res;
}
//fix phone number
export function fixPhone(phone) {
    if (phone === null || phone === undefined || phone === '') return '';
    if (!checkPhone(phone)) return phone;

    phone = phone.toString();
    phone = phone.replaceAll('-', '');
    phone = phone.replaceAll(' ', '');
    if (phone.length == 7 && phone[0] != 0) phone = '02' + phone;
    if ((phone.length == 8 || phone.length == 9) && phone[0] != 0) phone = phone = '0' + phone
    return phone;
}
//check if the value is a valid email
export function checkEmail(email) {
    if (email === null || email === undefined || email === '') return true;
    email = String(email).trim();
    if (email.length <= 0) return false;
    const res = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return res;
}

export function diffrentTime(start, end) {
    if (!start || !end) return 0;
    const [hours1, minutes1] = start.split(":").map(Number);
    const [hours2, minutes2] = end.split(":").map(Number);

    const date1 = new Date();
    date1.setHours(hours1, minutes1);

    const date2 = new Date();
    date2.setHours(hours2, minutes2);
    if (date2 < date1) date2.setDate(date2.getDate() + 1);
    const diffInMs = Math.abs(date2 - date1);
    const diffInMinutes = diffInMs / (1000 * 60);

    return diffInMinutes;
}



export function laterTime(time1, time2) {
    const [hours1, minutes1] = time1.split(":").map(Number);
    const [hours2, minutes2] = time2.split(":").map(Number);

    const date1 = new Date();
    date1.setHours(hours1, minutes1);

    const date2 = new Date();
    date2.setHours(hours2, minutes2);

    return date1 > date2 ? time1 : time2;
}

export function earlierTime(time1, time2) {
    const [hours1, minutes1] = time1.split(":").map(Number);
    const [hours2, minutes2] = time2.split(":").map(Number);

    const date1 = new Date();
    date1.setHours(hours1, minutes1);

    const date2 = new Date();
    date2.setHours(hours2, minutes2);

    return date1 < date2 ? time1 : time2;
}

export function isShaonKaitz() {
    return true;
}

//  פונקציה לחישוב אחוז רווח מתוך מחיר המכירה
export function calculateProfitPercentage(costPrice, sellingPrice) {
    if (sellingPrice === 0) return 0;
    return ((sellingPrice - costPrice) / sellingPrice) * 100;
}
