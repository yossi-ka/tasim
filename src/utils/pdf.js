import pdfMake from "pdfmake/build/pdfmake";

let base_url = process.env.NODE_ENV == "development"
    ? "http://XXXXXX/fonts/"
    : "https://XXXXX/fonts/"

// pdfMake.fonts = {
//     Hebrew: {
//         normal: `${base_url}Fredoka-Regular.ttf`,
//         bold: `${base_url}Fredoka-Bold.ttf`,
//         italics: `${base_url}Fredoka-SemiBold.ttf`,
//         bolditalics: `${base_url}Fredoka-Medium.ttf`
//     },
//     Roboto: {
//         normal: `${base_url}Fredoka-Regular.ttf`,
//         bold: `${base_url}Fredoka-Bold.ttf`,
//         italics: `${base_url}Fredoka-SemiBold.ttf`,
//         bolditalics: `${base_url}Fredoka-Medium.ttf`
//     }
// };
pdfMake.fonts = {
    Hebrew: {
        normal: `${base_url}arial.ttf`,
        bold: `${base_url}arialbd.ttf`,
        italics: `${base_url}ariali.ttf`,
        bolditalics: `${base_url}arialbi.ttf`
    },
    Roboto: {
        normal: `${base_url}arial.ttf`,
        bold: `${base_url}arialbd.ttf`,
        italics: `${base_url}ariali.ttf`,
        bolditalics: `${base_url}arialbi.ttf`
    }
};

const isHebrew = (text) => {
    text = "" + text;
    return text.search(/[\u0590-\u05FF]/) >= 0;
};

const rightToLeftText = (text) => {
    if (isHebrew(text)) {
        text = ' ' + text;
        //text = ' ' + text + ' ';
        return text.split(' ').reverse().join(' ');
    } else {
        return text;
    }
};

export function pdf(docDefinition, fileName = "file", isRTL = true) {
    // console.log(docDefinition);
    docDefinition.content.forEach((content) => {
        if (content.text) {
            content.text = rightToLeftText(content.text);
            content.font = 'Hebrew';
            content.alignment = content.alignment ? content.alignment : isRTL?'right':'left';
            content.margin = content.margin ? content.margin : [2, 2, 2, 2];
            content.direction = isRTL?'rtl':'ltr';
        }
        if (content.columns) {
            content.columns.forEach((c) => {
                if (c.text) {
                    c.text = rightToLeftText(c.text);
                    c.font = 'Hebrew';
                    c.direction = isRTL? 'rtl': 'ltr';
                    c.alignment = c.alignment ? c.alignment :isRTL? 'right': 'left';
                    c.margin = c.margin ? c.margin : [2, 2, 2, 2];
                }
            })
        }
        if (content.table) {
            content.table.body.map((row, idx) =>
                row.map((cell, idx2) => {
                    content.table.body[idx][idx2].text = rightToLeftText(content.table.body[idx][idx2].text);
                    content.table.body[idx][idx2].font = 'Hebrew';
                    content.table.body[idx][idx2].direction =isRTL? 'rtl': 'ltr';
                    content.table.body[idx][idx2].alignment = content.table.body[idx][idx2].alignment ?
                        content.table.body[idx][idx2].alignment:isRTL? 'right': 'left';
                    content.table.body[idx][idx2].margin = content.table.body[idx][idx2].margin ?
                        content.table.body[idx][idx2].margin: [2,2,2,2];

                   

                    return {
                        text: rightToLeftText("cell"),
                        font: 'Hebrew',
                        alignment:isRTL? 'right': 'left',
                        direction:isRTL? 'rtl': 'ltr',
                    }
                }))
        }
        // docDefinition.pageBreakBefore = true
    });
    pdfMake.createPdf(docDefinition).download(`${fileName}.pdf`);
}