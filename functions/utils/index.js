function formatDateTime(_date = null) {

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

const fixText = (text) => {
    let newText = text;
    const arrToReplace = [",", "'", '"', '-', '.', '?', '!', ',', ';', ':']
    arrToReplace.forEach(char => {
        newText = newText.replace(char, '')
    })
    return newText;
}

module.exports = {
    formatDateTime,
    fixText
}