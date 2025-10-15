// ==============================|| OVERRIDES - TABLE CELL ||============================== //

export default function TableCell(theme) {
    return {
        MuiTableCell: {
            styleOverrides: {
                root: {
                    fontSize: '100%',
                    padding: 4,
                    paddingTop: 10,
                    paddingBottom: 10,
                    textAlign: "center",
                    // borderColor: theme.palette.divider
                },
                head: {
                    backgroundColor : theme.palette.grey[100],
                    fontSize: '110%',
                    textAlign: "center",
                    lineHeight: 1.5,
                    fontWeight: 600,
                    paddingTop: 15,
                    paddingBottom: 15
                }
            }
        }
    };
}
