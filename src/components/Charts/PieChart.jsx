import React from 'react';

import { Divider, Stack, Tooltip, Typography, Box, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { formatNumber } from '../../utils/func';

const angleInRadians = angleInDegrees => (angleInDegrees - 90) * (Math.PI / 180.0);

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const a = angleInRadians(angleInDegrees);
    return {
        x: centerX + (radius * Math.cos(a)),
        y: centerY + (radius * Math.sin(a)),
    };
};

function describeArc(x, y, radius, spread, startAngle, endAngle) {

    var innerStart = polarToCartesian(x, y, radius, endAngle);
    var innerEnd = polarToCartesian(x, y, radius, startAngle);
    var outerStart = polarToCartesian(x, y, radius + spread, endAngle);
    var outerEnd = polarToCartesian(x, y, radius + spread, startAngle);

    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", outerStart.x, outerStart.y,
        "A", radius + spread, radius + spread, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
        "L", innerEnd.x, innerEnd.y,
        "A", radius, radius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
        "L", outerStart.x, outerStart.y, "Z"
    ].join(" ");

    return d;
}

let curSpread = 1;
let curSize = 1;

const PieChart = ({ title, size, spread, data }) => {

    const theme = useTheme();

    const [hovered, setHovered] = React.useState(null);
    const [clicked, setClicked] = React.useState(null);

    const [spreadState, setSpreadState] = React.useState(1);
    const [sizeState, setSizeState] = React.useState(size);

    const [dataState, setDataState] = React.useState([]);

    const middle = React.useMemo(() => size / 2, [size]);
    const radius = React.useMemo(() => sizeState / 3, [sizeState]);

    const sumValues = React.useMemo(() => data.reduce((acc, item) => acc + item.value, 0), [data]);
    React.useEffect(() => {
        let start = 0;
        const newData = data.map(item => {
            const end = start + item.value;
            const newItem = {
                ...item,
                start: start * 360 / sumValues,
                end: end * 360 / sumValues,
            }
            start = end;
            return newItem;
        });
        setDataState(newData);
    }, [sumValues]);


    React.useEffect(() => {
        curSpread = 1;
        const interval = setInterval(() => {
            if (curSpread < spread) {
                setSpreadState(curSpread);
                curSpread++;
            } else {
                clearInterval(interval);
            }
        }, 40);
        return () => clearInterval(interval);
    }, []);

    return (
        <Box sx={{ width: size }}>
            {title && <Typography variant="h5" align='left'>
                {title}
            </Typography>}
            <svg width={size} height={size}>
                {dataState.map((item, index) => <Tooltip
                    key={index}
                    title={<Stack direction="row" justifyContent="center" alignItems="center" spacing={2}>
                        <Typography>
                            {item.label} - {formatNumber(item.value)}
                        </Typography>
                        <FiberManualRecordIcon sx={{ color: theme.palette[item.color][400] }} />
                    </Stack>}
                >
                    <path
                        d={describeArc(middle, middle, radius, clicked === index ? spreadState * 1.25 : spreadState, item.start, item.end)}
                        fill={theme.palette[item.color][(hovered === index || clicked === index) ? 400 : 200]}
                        onClick={() => setClicked(clicked === index ? null : index)}
                        onMouseEnter={() => setHovered(index)}
                        onMouseLeave={() => setHovered(null)}
                    // style={{
                    //     opacity: clicked === index ? 1 : 0.5,
                    //     transition: 'opacity 0.5s',
                    //     ...(hovered === index && { opacity: 1 })
                    // }}
                    >
                        <animate
                            attributeName="fill"
                            from="#fff"
                            to={theme.palette[item.color][200]}
                            dur="1.5s"
                            repeatCount="1"
                        />
                    </path>
                </Tooltip>)}
                <text x="50%" y="45%" dominantBaseline="middle" textAnchor="middle" fill={clicked !== null ? theme.palette[dataState[clicked].color].main : theme.palette.secondary.main} style={{ fontSize: 16 }} onClick={() => setClicked(null)}>
                    {clicked !== null ? dataState[clicked].label : 'סה"כ'}
                </text>
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill={theme.palette.secondary.dark} style={{ fontSize: 30 }} onClick={() => setClicked(null)}>
                    {formatNumber(clicked !== null ? dataState[clicked].value : sumValues)}
                </text>
            </svg >
            <Divider />
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                {dataState.map((item, index) => <Stack key={index} direction="row" justifyContent="center" alignItems="center" spacing={0}>
                    <IconButton size='small' onClick={() => setClicked(clicked === index ? null : index)}>
                        <FiberManualRecordIcon sx={{ color: theme.palette[item.color][400] }} />
                    </IconButton>
                    <Typography variant='body2'>
                        {item.label}
                    </Typography>
                </Stack>)}
            </Stack >
        </Box >
    )
}

// default props
PieChart.defaultProps = {
    title: null,
    size: 350,
    spread: 20,
    data: [
        { value: 25, color: 'red', label: 'label 1' },
        { value: 25, color: 'blue', label: 'label 2' },
        { value: 25, color: 'orange', label: 'label 3' },
        { value: 25, color: 'yellow', label: 'label 4' },
        { value: 25, color: 'pink', label: 'label 5' },
    ]
};


export default PieChart;