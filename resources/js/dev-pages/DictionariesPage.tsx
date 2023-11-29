import {Title} from "@solidjs/meta";
import {createQuery} from "@tanstack/solid-query";
import {createSolidTable} from "@tanstack/solid-table";
import {ColumnHelper, IdentifiedColumnDef, createColumnHelper} from "@tanstack/table-core";
import {BigSpinner} from "components/ui/Spinner";
import {
  AUTO_SIZE_COLUMN_DEFS,
  Pagination,
  Table,
  cellFunc,
  getBaseTableOptions,
  useTableCells,
} from "components/ui/Table";
import {EMPTY_VALUE_SYMBOL} from "components/ui/symbols";
import {QueryBarrier} from "components/utils";
import {useAllAttributes} from "data-access/memo-api/attributes";
import {Dictionary, Position, useAllDictionaries} from "data-access/memo-api/dictionaries";
import {System} from "data-access/memo-api/groups";
import {Show, VoidComponent} from "solid-js";
import {useAttrValueFormatter} from "./util";
import {createMemo} from "solid-js";

export default (() => {
  const facilitiesQuery = createQuery(System.facilitiesQueryOptions);
  function getFacility(facilityId: string) {
    return facilitiesQuery.data?.find((f) => f.id === facilityId)?.name;
  }
  const dictionaries = useAllDictionaries();
  const attributes = useAllAttributes();
  const attrValueFormatter = useAttrValueFormatter();
  const tableCells = useTableCells();
  const h = createColumnHelper<Dictionary>();

  const textSort = {
    sortingFn: (a, b, colId) => ((a.getValue(colId) || "") as string).localeCompare(b.getValue(colId) || ""),
  } satisfies Partial<IdentifiedColumnDef<object>>;
  function getCommonColumns<E extends Dictionary | Position>(h: ColumnHelper<E>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const helper = h as ColumnHelper<any>;
    return [
      helper.accessor("id", {
        id: "Id",
        cell: tableCells.uuid,
        enableSorting: false,
        size: 60,
      }),
      h.accessor((d) => d.resource.name, {
        id: "Name",
        ...textSort,
      }),
      helper.accessor("label", {
        id: "Label",
        cell: cellFunc<string>((l) => <div class="italic">{l}</div>),
        ...textSort,
      }),
      helper.accessor("resource.isFixed", {
        id: "Fixed",
      }),
      helper.accessor("resource.facilityId", {
        id: "Facility",
        cell: (ctx) => (
          <Show when={ctx.getValue()} fallback={EMPTY_VALUE_SYMBOL}>
            {(facilityId) => getFacility(facilityId())}
          </Show>
        ),
        ...textSort,
      }),
    ];
  }

  const table = createMemo(() =>
    createSolidTable({
      ...getBaseTableOptions<Dictionary>({
        features: {
          sorting: [{id: "Label", desc: false}],
          pagination: {pageIndex: 0, pageSize: 1e6},
        },
        defaultColumn: AUTO_SIZE_COLUMN_DEFS,
      }),
      get data() {
        return [...(dictionaries() || [])];
      },
      columns: [
        ...getCommonColumns(h),
        ...(attributes()
          ?.getForModel("dictionary")
          .map((attr) =>
            h.accessor((row) => attr.readFrom(row.resource), {
              id: `@${attr.resource.name}`,
              cell: (ctx) => <>{attrValueFormatter(attr, ctx.getValue())}</>,
            }),
          ) || []),
        h.accessor("allPositions", {
          id: "Positions",
          enableSorting: false,
          cell: (ctx) => {
            // eslint-disable-next-line solid/reactivity
            const dict = ctx.row.original;
            // eslint-disable-next-line solid/reactivity
            const positions = ctx.getValue() as Position[];
            const h = createColumnHelper<Position>();
            const table = createSolidTable({
              ...getBaseTableOptions<Position>({
                features: {
                  sorting: [{id: "Label", desc: false}],
                },
                defaultColumn: AUTO_SIZE_COLUMN_DEFS,
              }),
              data: positions,
              columns: [
                ...getCommonColumns(h),
                h.accessor("disabled", {
                  id: "Disabled",
                }),
                ...((attributes() &&
                  dict.resource.positionRequiredAttributes
                    ?.map((attrId) => attributes()!.get(attrId)!)
                    .sort((a, b) => a.resource.defaultOrder - b.resource.defaultOrder)
                    .map((attr) =>
                      h.accessor((p) => attr.readFrom(p.resource), {
                        id: `@${attr.resource.name}`,
                        cell: (ctx) => <>{attrValueFormatter(attr, ctx.getValue())}</>,
                      }),
                    )) ||
                  []),
              ],
            });
            return (
              <Table
                table={table}
                belowTable={() =>
                  positions.length ? (
                    <div class="flex items-stretch gap-1">
                      <Pagination />
                      <div class="flex items-center">Positions: {positions.length}</div>
                    </div>
                  ) : undefined
                }
              />
            );
          },
        }),
      ],
    }),
  );

  return (
    <QueryBarrier queries={[facilitiesQuery]}>
      <Title>Dictionaries</Title>
      <div class="contents text-sm">
        <Show when={dictionaries() && attributes()} fallback={<BigSpinner />}>
          <Table table={table()} mode="standalone" />
        </Show>
      </div>
    </QueryBarrier>
  );
}) satisfies VoidComponent;
