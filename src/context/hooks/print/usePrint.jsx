import { useRef, useState, useCallback, useEffect } from 'react';
import ReactToPrint from 'react-to-print';

const usePrint = () => {
    const reactToPrintRef = useRef();
    const [isPrinting, setIsPrinting] = useState(false);
    const [content, setContent] = useState(null);
    const [printOptions, setPrintOptions] = useState({});
    const ref = useRef(null);

    const handlePrint = useCallback((printContent, options = {}) => {
        const {
            pageSize = 'A4', // ברירת מחדל A4, יכול להיות גם 'A4', 'A3', '11cm 22cm', וכו'
            isLandscape = false, // ברירת מחדל portrait (לא מסובב)
            pageStyle = null // עיצוב עמוד מותאם אישית
        } = options;

        setContent(printContent);
        setPrintOptions({ pageSize, isLandscape, pageStyle });
        setIsPrinting(true);
    }, []);

    useEffect(() => {
        if (isPrinting && reactToPrintRef.current) {
            reactToPrintRef.current.handlePrint();
            setIsPrinting(false);
        }
    }, [isPrinting]);

    // יצירת עיצוב עמוד דינמי
    const getPageStyle = () => {
        const { pageStyle, pageSize, isLandscape } = printOptions;
        if (pageStyle) return pageStyle;
        
        const orientation = isLandscape ? 'landscape' : 'portrait';
        return `@page { size: ${pageSize} ${orientation}; margin: 0; }`;
    };

    // יצירת עיצוב עמוד דינמי עבור התוכן
    const getContentStyle = () => {
        const { isLandscape, pageSize } = printOptions;
        
        if (isLandscape) {
            // אם זה גודל מותאם אישית, נשתמש בו
            if (pageSize && pageSize.includes('cm')) {
                const dimensions = pageSize.split(' ');
                const width = dimensions[0];
                const height = dimensions[1] || dimensions[0];
                return {
                    transform: `rotate(90deg) translateY(-${height})`,
                    transformOrigin: 'top left',
                    width: height,
                    height: width,
                };
            }
            // עבור A4 landscape
            return {
                transform: 'rotate(90deg) translateY(-21cm)',
                transformOrigin: 'top left',
                width: '29.7cm',
                height: '21cm',
            };
        }
        
        // Portrait mode
        if (pageSize && pageSize.includes('cm')) {
            const dimensions = pageSize.split(' ');
            const width = dimensions[0];
            const height = dimensions[1] || dimensions[0];
            return {
                width: width,
                minHeight: height,
            };
        }
        
        // A4 Portrait (ברירת מחדל)
        return {
            width: '21cm',
            minHeight: '29.7cm',
        };
    };

    // חישוב עיצוב עמוד דינמי
    const getCurrentPageStyle = () => {
        const { pageStyle, pageSize, isLandscape } = printOptions;
        if (pageStyle) return pageStyle;
        
        if (Object.keys(printOptions).length === 0) {
            return '@page { size: A4 portrait; margin: 0; }';
        }
        
        const orientation = isLandscape ? 'landscape' : 'portrait';
        return `@page { size: ${pageSize} ${orientation}; margin: 0; }`;
    };

    // חישוב עיצוב תוכן דינמי
    const getCurrentContentStyle = () => {
        if (Object.keys(printOptions).length === 0) {
            return {
                width: '21cm',
                minHeight: '29.7cm',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pageBreakAfter: 'always'
            };
        }
        
        return {
            ...getContentStyle(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pageBreakAfter: 'always'
        };
    };

    const printComponent = (
        <div style={{ display: 'none' }}>
            <ReactToPrint
                ref={reactToPrintRef}
                trigger={() => <button style={{ display: 'none' }}>הדפס</button>}
                content={() => ref.current}
                pageStyle={getCurrentPageStyle()}
            />
            <div ref={ref} >
                {content && Array.isArray(content) && content.map((pageContent, index) => (
                    <div key={index} style={getCurrentContentStyle()}>
                        <div dir='rtl'>
                            {pageContent}
                        </div>
                    </div>))}
            </div>
        </div>
    );

    return { handlePrint, printComponent };
};

export default usePrint;
