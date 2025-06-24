import React from 'react';

import { Divider, Stack, Tooltip, Typography, Box, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';


const LineChart = ({ title, size, arrX, arrY, data, maxValue, minValue }) => {

    const theme = useTheme();

    const width = React.useMemo(() => size * 2, [size]);
    const height = React.useMemo(() => size, [size]);

    const titleBottomBox = React.useMemo(() => (width - 25) / arrX.length, [width]);
    const titleRightBox = React.useMemo(() => (height - 25) / arrY.length, [height]);
    const numberToPoint = (height - 25) / (maxValue - minValue ) 
    return (
        <Box>
            {title && <Typography variant="h5" align='left'>
                {title}
            </Typography>}
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ width: 1, height: 1 }}>
                <svg width={width} height={height}>
                    {arrX.map((item, index) => {
                        return <text
                            key={index}
                            x={(width - 25) - (titleBottomBox * index)}
                            y={size - 10}
                            dominantBaseline="middle"
                            textAnchor="start"
                            fontSize="12px"
                            fill={theme.palette.text.secondary}
                        >
                            {item}
                        </text>
                    })}
                    {arrY.map((item, index) => {
                        return <text
                            key={index}
                            x={width}
                            y={(size - 25) - (titleRightBox * index)}
                            dominantBaseline="end"
                            textAnchor="start"
                            fontSize="12px"
                            fill={theme.palette.text.secondary}
                        >
                            {item}
                        </text>
                    })}
                    {arrY.map((item, index) => {
                        return <line
                            key={index}
                            x1={20}
                            y1={(size - 25) - (titleRightBox * index)}
                            x2={width - 30}
                            y2={(size - 25) - (titleRightBox * index)}
                            stroke={theme.palette.text.secondary}
                            strokeWidth={0.3}
                            strokeDasharray="3,6"
                        />
                    })}

                    {data.map((item, index) => {
                        return <path
                            key={index}
                            d={item.data.map((item2, i) => {
                                // let indexY = arrY.indexOf(item2);
                                const sideX = (width - 30) - (titleBottomBox * i);
                                const sideY = (size - 25) - (item2 *numberToPoint) //(titleRightBox * indexY);
                                const pieceSideX = titleBottomBox / 5;
                                // const firstY = (size - 25) - (titleRightBox * (arrY.indexOf(item.data[i - 1])));
                                if (i === 0) return `M ${width - 30} ${sideY}`

                                const firstY = (size - 25) - (item.data[i-1] *numberToPoint)
                                // const previousY = (size - 25) - (titleRightBox * (arrY.indexOf(data[i-1])));
                                return `C ${sideX + (pieceSideX * 3)} ${firstY}
                                ${sideX + (pieceSideX * 2)} ${sideY}
                                ${sideX} ${sideY}`;
                                // return `C 50 50
                                // 50 50
                                // ${(width - 30) - (titleBottomBox * i)} ${(size - 25) - (titleRightBox * indexY)}`;
                                // return `L ${(width - 30) - (titleBottomBox * i)} ${(size - 25) - (titleRightBox * indexY)}`;
                            }).join(' ')}
                            stroke={theme.palette[item.color][400]}
                            strokeWidth={4}
                            fill="none"
                        />
                    })}


                    {/* <path d="M20,230 Q40,205 50,230 T90,230" fill="none" stroke="blue" stroke-width="5"/> */}

                    {/* <path d="M50,50 
                        C50,50 75,100 100,100 
                        C125,100 150,50 150,50" stroke="black" fill="none" stroke-width="2" /> */}
                </svg>
            </Stack>
            <Divider sx={{ mt: 1 }}/>
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                {data.map((item, index) => <Stack key={index} direction="row" justifyContent="center" alignItems="center" spacing={0} sx={{ mx: 2 }}>
                    {/* <IconButton size='small' onClick={() => setClicked(clicked === index ? null : index)}> */}
                        <FiberManualRecordIcon sx={{ color: theme.palette[item.color][400] }} />
                    {/* </IconButton> */}
                    <Typography variant='body2'>
                        {item.label}
                    </Typography>
                </Stack>)}
            </Stack>
        </Box>
    )
}

LineChart.defaultProps = {
    size: 350,
    arrX: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני'],
    arrY: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    data: [
        { label: 'סטטוס 1', color: 'primary', data: [100, 200, 400, 300, 500, 600, 800, 700, 900, 800, 700, 800] },
        { label: 'סטטוס 2', color: 'success', data: [100, 100, 300, 200, 300, 300, 500, 600, 800, 700, 900, 1000] },
    ]
}

export default LineChart

// import React from 'react';

// import { Divider, Stack, Tooltip, Typography, Box, IconButton } from '@mui/material';
// import { useTheme } from '@mui/material/styles';



// const LineChart = ({ title, size, arrX, arrY, data }) => {

//     const theme = useTheme();

//     const width = React.useMemo(() => size * 2, [size]);
//     const height = React.useMemo(() => size, [size]);

//     const titleBottomBox = React.useMemo(() => (width - 25) / arrX.length, [width]);
//     const titleRightBox = React.useMemo(() => (height - 25) / arrY.length, [height]);

//     return (
//         <Box>
//             {title && <Typography variant="h5" align='left'>
//                 {title}
//             </Typography>}
//             <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ width:1, height:1 }}>
//                 <svg width={width} height={height}>
//                     {arrX.map((item, index) => {
//                         return <text
//                             key={index}
//                             x={ (width - 25) - (titleBottomBox * index)}
//                             y={size - 10}
//                             dominantBaseline="middle"
//                             textAnchor="start"
//                             fontSize="12px"
//                             fill={theme.palette.text.secondary}
//                         >
//                             {item}
//                         </text>
//                     })}
//                     {arrY.map((item, index) => {
//                         return <text
//                             key={index}
//                             x={width}
//                             y={(size - 25) - (titleRightBox * index)}
//                             dominantBaseline="end"
//                             textAnchor="start"
//                             fontSize="12px"
//                             fill={theme.palette.text.secondary}
//                         >
//                             {item}
//                         </text>
//                     })}
//                     {arrY.map((item, index) => {
//                         return <line
//                             key={index}
//                             x1={20}
//                             y1={(size - 25) - (titleRightBox * index)}
//                             x2={width - 30}
//                             y2={(size - 25) - (titleRightBox * index)}
//                             stroke={theme.palette.text.secondary}
//                             strokeWidth={0.3}
//                             strokeDasharray="3,6"
//                         />
//                     })}
//                     {/* print path for data array */}
//                     {data.map((item, index) => {
//                         return <path
//                             key={index}
//                             d={item.data.map((item, i) => {
//                                 // <path d="M50,50 C50,50 75,100 100,100 C125,100 150,50 150,50" stroke="black" fill="none" stroke-width="2" />
//                                 // get index from arrY with item
//                                 let indexY = arrY.indexOf(item);
//                                 if(i === 0) return `M ${width - 30} ${(size - 25) - (titleRightBox * indexY)}`
//                                 // return `C ${20 + (titleBottomBox * i)} ${(size - 25) - (titleRightBox * item)}`
//                                 return `L ${(width - 30) - (titleBottomBox * i)} ${(size - 25) - (titleRightBox * indexY)}`;
//                             }).join(' ')}
//                             stroke={theme.palette[item.color][400]}
//                             strokeWidth={2}
//                             fill={theme.palette[item.color][400]}
//                         />
//                     })}
//                     {/* <path d="M50,50 C50,50 75,100 100,100" stroke="black" fill="none" stroke-width="2" /> */}
//                     {/* <path d="M50,50 C60,40 75,90 100,100" stroke="black" fill="none" stroke-width="2" /> */}
//                     {/* <path d="M50,50
//                         C50,50 75,100 100,100
//                         C125,100 150,50 150,50" stroke="black" fill="none" stroke-width="2" /> */}
//                 </svg>
//             </Stack>
//             <Divider />
//             <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 1 }}>
//                 {/* {dataState.map((item, index) => <Stack key={index} direction="row" justifyContent="center" alignItems="center" spacing={0}>
//                     <IconButton size='small' onClick={() => setClicked(clicked === index ? null : index)}>
//                         <FiberManualRecordIcon sx={{ color: theme.palette[item.color][400] }} />
//                     </IconButton>
//                     <Typography variant='body2'>
//                         {item.label}
//                     </Typography>
//                 </Stack>)} */}
//             </Stack>
//         </Box>
//     )
// }

// LineChart.defaultProps = {
//     size: 350,
//     arrX: ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'],
//     arrY: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
//     data: [
//         { label: 'סטטוס 1', color: 'primary', data: [500, 100, 400, 900, 100, 600, 800, 200, 300, 100] },
//         // { label: 'סטטוס 2', color: 'secondary', data: [100, 500, 300, 200, 600, 100, 700, 300, 900, 100] },
//     ]
// }

// export default LineChart