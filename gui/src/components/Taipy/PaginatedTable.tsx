import React, {
    useState,
    useEffect,
    useContext,
    useCallback,
    useRef,
    useMemo,
    CSSProperties,
    ChangeEvent,
    MouseEvent,
} from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import { visuallyHidden } from "@mui/utils";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import DataSaverOn from "@mui/icons-material/DataSaverOn";
import DataSaverOff from "@mui/icons-material/DataSaverOff";

import { TaipyContext } from "../../context/taipyContext";
import { createRequestTableUpdateAction, createSendActionNameAction } from "../../context/taipyReducers";
import {
    addDeleteColumn,
    baseBoxSx,
    EditableCell,
    EDIT_COL,
    getClassName,
    getsortByIndex,
    headBoxSx,
    LINE_STYLE,
    OnCellValidation,
    OnRowDeletion,
    Order,
    PageSizeOptionsType,
    paperSx,
    RowType,
    RowValue,
    tableSx,
    TaipyPaginatedTableProps,
    ColumnDesc,
    iconInRowSx,
} from "./tableUtils";
import { useDispatchRequestUpdateOnFirstRender, useDynamicProperty, useFormatConfig } from "../../utils/hooks";

const loadingStyle: CSSProperties = { width: "100%", height: "3em", textAlign: "right", verticalAlign: "center" };
const skelSx = { width: "100%", height: "3em" };

const rowsPerPageOptions: PageSizeOptionsType = [10, 50, 100, 500];

const PaginatedTable = (props: TaipyPaginatedTableProps) => {
    const {
        className,
        id,
        updateVarName,
        pageSize = 100,
        pageSizeOptions,
        allowAllRows = false,
        showAll = false,
        height,
        selected = [],
        updateVars,
        tp_onEdit = "",
        tp_onDelete = "",
        tp_onAdd = "",
        width = "100vw",
    } = props;
    const [value, setValue] = useState<Record<string, unknown>>({});
    const [startIndex, setStartIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(pageSize);
    const [order, setOrder] = useState<Order>("asc");
    const [orderBy, setOrderBy] = useState("");
    const [loading, setLoading] = useState(true);
    const [aggregates, setAggregates] = useState<string[]>([]);
    const { dispatch } = useContext(TaipyContext);
    const pageKey = useRef("no-page");
    const selectedRowRef = useRef<HTMLTableRowElement | null>(null);
    const formatConfig = useFormatConfig();

    const refresh = props.data === null;
    const active = useDynamicProperty(props.active, props.defaultActive, true);
    const editable = useDynamicProperty(props.editable, props.defaultEditable, true);
    const hover = useDynamicProperty(props.hoverText, props.defaultHoverText, undefined);

    const [colsOrder, columns, styles, handleNan] = useMemo(() => {
        let hNan = !!props.nanValue;
        if (props.columns) {
            try {
                const columns = (
                    typeof props.columns === "string" ? JSON.parse(props.columns) : props.columns
                ) as Record<string, ColumnDesc>;
                Object.values(columns).forEach((col) => {
                    if (typeof col.notEditable != "boolean") {
                        col.notEditable = !editable;
                    } else {
                        col.notEditable = col.notEditable || !editable;
                    }
                });
                addDeleteColumn(!!(active && editable && (tp_onAdd || tp_onDelete)), columns);
                const colsOrder = Object.keys(columns).sort(getsortByIndex(columns));
                const styles = colsOrder.reduce<Record<string, string>>((pv, col) => {
                    if (columns[col].style) {
                        pv[columns[col].dfid] = columns[col].style as string;
                    }
                    hNan = hNan || !!columns[col].nanValue;
                    return pv;
                }, {});
                if (props.lineStyle) {
                    styles[LINE_STYLE] = props.lineStyle;
                }
                return [colsOrder, columns, styles, hNan];
            } catch (e) {
                console.info("PTable.columns: " + ((e as Error).message || e));
            }
        }
        return [[], {}, {}, hNan];
    }, [active, editable, tp_onAdd, tp_onDelete, props.columns, props.lineStyle, props.nanValue]);

    useDispatchRequestUpdateOnFirstRender(dispatch, id, updateVars);

    useEffect(() => {
        if (selected.length) {
            if (selected[0] < startIndex || selected[0] > startIndex + rowsPerPage) {
                setLoading(true);
                setStartIndex(rowsPerPage * Math.floor(selected[0] / rowsPerPage));
            }
        }
    }, [selected, startIndex, rowsPerPage]);

    useEffect(() => {
        if (props.data && props.data[pageKey.current] !== undefined) {
            setValue(props.data[pageKey.current]);
            setLoading(false);
        }
    }, [props.data]);

    useEffect(() => {
        const endIndex = showAll ? -1 : startIndex + rowsPerPage;
        const agg = aggregates.length
            ? colsOrder.reduce((pv, col, idx) => {
                  if (aggregates.includes(columns[col].dfid)) {
                      return pv + "-" + idx;
                  }
                  return pv;
              }, "-agg")
            : "";
        const cols = colsOrder.map((col) => columns[col].dfid);
        pageKey.current = `${startIndex}-${endIndex}-${cols.join()}-${orderBy}-${order}${agg}`;
        if (refresh || !props.data || props.data[pageKey.current] === undefined) {
            setLoading(true);
            const applies = aggregates.length
                ? colsOrder.reduce<Record<string, unknown>>((pv, col) => {
                      if (columns[col].apply) {
                          pv[columns[col].dfid] = columns[col].apply;
                      }
                      return pv;
                  }, {})
                : undefined;
            dispatch(
                createRequestTableUpdateAction(
                    updateVarName,
                    id,
                    cols,
                    pageKey.current,
                    startIndex,
                    endIndex,
                    orderBy,
                    order,
                    aggregates,
                    applies,
                    styles,
                    handleNan
                )
            );
        } else {
            setValue(props.data[pageKey.current]);
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        refresh,
        startIndex,
        aggregates,
        colsOrder,
        columns,
        showAll,
        rowsPerPage,
        order,
        orderBy,
        updateVarName,
        id,
        handleNan,
        dispatch,
    ]);

    const onSort = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            const col = e.currentTarget.getAttribute("data-dfid");
            if (col) {
                const isAsc = orderBy === col && order === "asc";
                setOrder(isAsc ? "desc" : "asc");
                setOrderBy(col);
            }
        },
        [orderBy, order]
    );

    const handleChangePage = useCallback(
        (event: unknown, newPage: number) => {
            setStartIndex(newPage * rowsPerPage);
        },
        [rowsPerPage]
    );

    const handleChangeRowsPerPage = useCallback((event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setLoading(true);
        setRowsPerPage(parseInt(event.target.value, 10));
        setStartIndex(0);
    }, []);

    const onAggregate = useCallback((e: MouseEvent<HTMLElement>) => {
        const groupBy = e.currentTarget.getAttribute("data-dfid");
        if (groupBy) {
            setAggregates((ags) => {
                const nags = ags.filter((ag) => ag !== groupBy);
                if (ags.length == nags.length) {
                    nags.push(groupBy);
                }
                return nags;
            });
        }
        e.stopPropagation();
    }, []);

    const onAddRowClick = useCallback(
        () =>
            dispatch(
                createSendActionNameAction(updateVarName, {
                    action: tp_onAdd,
                    index: startIndex,
                })
            ),
        [startIndex, dispatch, updateVarName, tp_onAdd]
    );

    const onCellValidation: OnCellValidation = useCallback(
        (value: RowValue, rowIndex: number, colName: string) =>
            dispatch(
                createSendActionNameAction(updateVarName, {
                    action: tp_onEdit,
                    value: value,
                    index: rowIndex,
                    col: colName,
                })
            ),
        [dispatch, updateVarName, tp_onEdit]
    );

    const onRowDeletion: OnRowDeletion = useCallback(
        (rowIndex: number) =>
            dispatch(
                createSendActionNameAction(updateVarName, {
                    action: tp_onDelete,
                    index: rowIndex,
                })
            ),
        [dispatch, updateVarName, tp_onDelete]
    );

    const tableContainerSx = useMemo(() => ({ maxHeight: height }), [height]);

    const pso = useMemo(() => {
        let psOptions = rowsPerPageOptions;
        if (pageSizeOptions) {
            try {
                psOptions = JSON.parse(pageSizeOptions);
            } catch (e) {
                console.log("PaginatedTable pageSizeOptions is wrong ", pageSizeOptions, e);
            }
        }
        if (allowAllRows) {
            return psOptions.concat([{ value: -1, label: "All" }]);
        }
        return psOptions;
    }, [pageSizeOptions, allowAllRows]);

    const { rows, rowCount } = useMemo(() => {
        const ret = { rows: [], rowCount: 0 } as { rows: RowType[]; rowCount: number };
        if (value) {
            if (value.data) {
                ret.rows = value.data as RowType[];
            }
            if (value.rowcount) {
                ret.rowCount = value.rowcount as unknown as number;
            }
        }
        return ret;
    }, [value]);

    const boxSx = useMemo(() => ({ ...baseBoxSx, width: width }), [width]);

    return (
        <Box id={id} sx={boxSx}>
            <Paper sx={paperSx}>
                <Tooltip title={hover || ""}>
                    <TableContainer sx={tableContainerSx}>
                        <Table
                            sx={tableSx}
                            aria-labelledby="tableTitle"
                            size="small"
                            className={className}
                            stickyHeader={true}
                        >
                            <TableHead>
                                <TableRow>
                                    {colsOrder.map((col, idx) => (
                                        <TableCell
                                            key={col + idx}
                                            sortDirection={orderBy === columns[col].dfid && order}
                                            width={columns[col].width}
                                        >
                                            {columns[col].dfid === EDIT_COL ? (
                                                    active && editable && tp_onAdd ? (
                                                        <Tooltip title="Add a row" key="addARow">
                                                            <IconButton
                                                                onClick={onAddRowClick}
                                                                size="small"
                                                                sx={iconInRowSx}
                                                            >
                                                                <AddIcon fontSize="inherit" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    ) : null
                                            ) : (
                                                <TableSortLabel
                                                    active={orderBy === columns[col].dfid}
                                                    direction={orderBy === columns[col].dfid ? order : "asc"}
                                                    data-dfid={columns[col].dfid}
                                                    onClick={onSort}
                                                    disabled={!active}
                                                >
                                                    <Box sx={headBoxSx}>
                                                        {columns[col].groupBy ? (
                                                            <IconButton
                                                                onClick={onAggregate}
                                                                size="small"
                                                                title="aggregate"
                                                                data-dfid={columns[col].dfid}
                                                                disabled={!active}
                                                                sx={iconInRowSx}
                                                            >
                                                                {aggregates.includes(columns[col].dfid) ? (
                                                                    <DataSaverOff fontSize="inherit" />
                                                                ) : (
                                                                    <DataSaverOn fontSize="inherit" />
                                                                )}
                                                            </IconButton>
                                                        ) : null}
                                                        {columns[col].title === undefined
                                                            ? columns[col].dfid
                                                            : columns[col].title}
                                                    </Box>
                                                    {orderBy === columns[col].dfid ? (
                                                        <Box component="span" sx={visuallyHidden}>
                                                            {order === "desc"
                                                                ? "sorted descending"
                                                                : "sorted ascending"}
                                                        </Box>
                                                    ) : null}
                                                </TableSortLabel>
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.map((row, index) => {
                                    const sel = selected.indexOf(index + startIndex);
                                    if (sel == 0) {
                                        setTimeout(
                                            () => selectedRowRef.current?.scrollIntoView && selectedRowRef.current.scrollIntoView({ block: "center" }),
                                            1
                                        );
                                    }
                                    return (
                                        <TableRow
                                            hover
                                            tabIndex={-1}
                                            key={"row" + index}
                                            selected={sel > -1}
                                            ref={sel == 0 ? selectedRowRef : undefined}
                                            className={getClassName(rows[index], props.lineStyle)}
                                        >
                                            {colsOrder.map((col, cidx) => (
                                                <EditableCell
                                                    key={"val" + index + "-" + cidx}
                                                    className={getClassName(row, columns[col].style)}
                                                    colDesc={columns[col]}
                                                    value={row[col]}
                                                    formatConfig={formatConfig}
                                                    rowIndex={index}
                                                    onValidation={
                                                        active && editable && tp_onEdit ? onCellValidation : undefined
                                                    }
                                                    onDeletion={
                                                        active && editable && tp_onDelete ? onRowDeletion : undefined
                                                    }
                                                    nanValue={columns[col].nanValue || props.nanValue}
                                                />
                                            ))}
                                        </TableRow>
                                    );
                                })}
                                {rows.length == 0 &&
                                    loading &&
                                    Array.from(Array(30).keys(), (v, idx) => (
                                        <TableRow hover key={"rowskel" + idx}>
                                            {colsOrder.map((col, cidx) => (
                                                <TableCell key={"skel" + cidx}>
                                                    <Skeleton sx={skelSx} />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Tooltip>
                {!showAll &&
                    (loading ? (
                        <Skeleton sx={loadingStyle}>
                            <Typography>Loading...</Typography>
                        </Skeleton>
                    ) : (
                        <TablePagination
                            component="div"
                            count={rowCount}
                            page={startIndex / rowsPerPage}
                            rowsPerPage={rowsPerPage}
                            showFirstButton={true}
                            showLastButton={true}
                            rowsPerPageOptions={pso}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    ))}
            </Paper>
        </Box>
    );
};

export default PaginatedTable;
