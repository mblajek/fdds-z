import {PaginationState, SortingState, VisibilityState} from "@tanstack/solid-table";
import {debouncedAccessor} from "components/utils";
import {Accessor, Signal, createComputed, createMemo, createSignal, on} from "solid-js";
import {SetStoreFunction, Store, createStore} from "solid-js/store";
import {ColumnFilter, DataRequest, DataResponse, Filter, RequestCreator, Schema} from ".";

/** A collection of column filters, keyed by column name. */
type ColumnFilters = Partial<Record<string, ColumnFilter | undefined>>;

interface RequestController {
  columnVisibility: Signal<VisibilityState>;
  globalFilter: Signal<string>;
  columnFilters: [Store<ColumnFilters>, SetStoreFunction<ColumnFilters>];
  sorting: Signal<SortingState>;
  pagination: Signal<PaginationState>;
}

const DEFAULT_PAGE_SIZE = 50;

/**
 * Returns visibility state with visibility of all the columns set explicitly to the given value.
 */
function allColumnsVisibility(schema: Schema, {visible = true} = {}) {
  const visibility: VisibilityState = {}
  for (const {name} of schema.columns)
    visibility[name] = visible;
  return visibility;
}

/**
 * Creates a requets creator with a collection of helpers to use together with a TanStack Table.
 *
 * The request itself is a memo combining data from the signals exposed in the RequestController.
 * These signals can be plugged directly into the table state.
 */
export function createTableRequestCreator({
  intrinsicFilter = () => undefined,
  initialPageSize = DEFAULT_PAGE_SIZE,
}: {
  intrinsicFilter?: Accessor<Filter | undefined>,
  initialPageSize?: number,
}): RequestCreator<RequestController> {
  return schema => {
    const [allInited, setAllInited] = createSignal(false);
    const [columnVisibility, setColumnVisibility] = createSignal<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = createSignal<string>("");
    const [columnFilters, setColumnFilters] = createStore<ColumnFilters>({});
    const [sorting, setSorting] = createSignal<SortingState>([]);
    const [pagination, setPagination] =
      createSignal<PaginationState>({pageIndex: 0, pageSize: initialPageSize});
    // Initialise the request parts based on the schema.
    createComputed(() => {
      const sch = schema();
      if (sch) {
        let visibility: VisibilityState;
        if (sch.suggestedColumns) {
          visibility = allColumnsVisibility(sch, {visible: false});
          for (const name of sch.suggestedColumns)
            visibility[name] = true;
        } else
          visibility = allColumnsVisibility(sch);
        setColumnVisibility(visibility);
        setColumnFilters({});
        for (const {name} of sch.columns)
          setColumnFilters(name, undefined);
        setSorting((sch.suggestedSort || []).map(({column, dir}) => ({
          id: column,
          desc: dir === "desc",
        })));
        setAllInited(true);
      }
    });
    // Don't allow hiding all the columns.
    createComputed(on([schema, columnVisibility],
      ([schema, columnVisibility], prev) => {
        if (schema && !Object.values(columnVisibility).some(v => v)) {
          const prevColumnVisibility = prev?.[1];
          // Revert to the previous visibility state if possible, otherwise show all columns.
          setColumnVisibility(
            prevColumnVisibility && Object.values(prevColumnVisibility).some(v => v) ?
              prevColumnVisibility : allColumnsVisibility(schema));
        }
      }));
    /** The primary sort column, wrapped in memo to detect actual changes. */
    const mainSort = createMemo(() => sorting()[0]);
    /**
     * Array of column filters. This intermediate step is helpful because on() cannot track
     * the whole column filters store.
     */
    const columnFiltersJoined = createMemo(() =>
      Object.values(columnFilters).filter((e): e is ColumnFilter => !!e)
        .map(filter => ({...filter})));
    // Go back to the first page on significant data changes.
    createComputed(on([globalFilter, columnFiltersJoined, mainSort], () => {
      setPagination(prev => ({...prev, pageIndex: 0}));
    }));
    // eslint-disable-next-line solid/reactivity
    const debouncedGlobalFilter = debouncedAccessor(globalFilter);
    const request = createMemo<DataRequest | undefined>(
      on([intrinsicFilter, schema, allInited,
        columnVisibility, debouncedGlobalFilter, columnFiltersJoined, sorting, pagination],
        ([intrinsicFilter, schema, allInited,
          columnVisibility, globalFilter, columnFiltersJoined, sorting, pagination]) => {
          if (!schema || !allInited)
            return undefined;
          const columns = new Set(schema.columns.map(({name}) => name));
          for (const [name, visible] of Object.entries(columnVisibility))
            if (!visible)
              columns.delete(name);
          const sort = sorting.map(({id, desc}) => ({
            type: "column",
            column: id,
            dir: desc ? "desc" : "asc",
          } as const));
          const andFilters: Filter[] = [];
          if (intrinsicFilter)
            andFilters.push(intrinsicFilter);
          if (globalFilter)
            andFilters.push({
              type: "global",
              op: "%v%",
              val: globalFilter,
            });
          andFilters.push(...columnFiltersJoined);
          const request: DataRequest = {
            columns: Array.from(columns, column => ({type: "column", column})),
            filter: {
              type: "op",
              op: "&",
              val: andFilters,
            },
            sort,
            paging: pagination,
          };
          return request;
        }));
    return {
      request,
      requestController: {
        columnVisibility: [columnVisibility, setColumnVisibility],
        globalFilter: [globalFilter, setGlobalFilter],
        columnFilters: [columnFilters, setColumnFilters],
        sorting: [sorting, setSorting],
        pagination: [pagination, setPagination],
      } satisfies RequestController,
    };
  };
}

interface TableHelperInterface {
  rowsCount: Accessor<number | undefined>;
  pageCount: Accessor<number>;
  /** A signal that changes whenever the table needs to be scrolled back to top. */
  scrollToTopSignal: Accessor<unknown>;
}

export function tableHelper({requestController, response}: {
  requestController: RequestController,
  response: Accessor<DataResponse | undefined>,
}): TableHelperInterface {
  const rowsCount = () => response()?.meta.totalDataSize;
  const pageCount = createMemo(() => Math.ceil(
    Math.max(rowsCount() || 0, 1) / requestController.pagination[0]().pageSize));
  const scrollToTopSignal = () => requestController.pagination[0]().pageIndex;
  return {rowsCount, pageCount, scrollToTopSignal};
}