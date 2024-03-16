import {createQuery} from "@tanstack/solid-query";
import {createSolidTable} from "@tanstack/solid-table";
import {IdentifiedColumnDef, createColumnHelper} from "@tanstack/table-core";
import {BigSpinner} from "components/ui/Spinner";
import {
  AUTO_SIZE_COLUMN_DEFS,
  Header,
  PaddedCell,
  ShowCellVal,
  Table,
  cellFunc,
  getBaseTableOptions,
  useTableCells,
} from "components/ui/Table";
import {QueryBarrier} from "components/utils";
import {Attribute} from "data-access/memo-api/attributes";
import {System} from "data-access/memo-api/groups";
import {AttributeType} from "data-access/memo-api/resources/attribute.resource";
import {Setter, Show, VoidComponent, createMemo} from "solid-js";
import {Select} from "../components/ui/form/Select";
import {EMPTY_VALUE_SYMBOL} from "../components/ui/symbols";
import {useAllAttributes} from "../data-access/memo-api/dictionaries_and_attributes_context";
import {MemoTitle} from "../features/root/MemoTitle";
import {useAttrValueFormatter} from "./util";

export default (() => {
  const facilitiesQuery = createQuery(System.facilitiesQueryOptions);
  function getFacility(facilityId: string) {
    return facilitiesQuery.data?.find((f) => f.id === facilityId)?.name;
  }
  const attributes = useAllAttributes();

  const models = createMemo(() => [...new Set(Array.from(attributes() || [], (a) => a.model))].sort());

  const attrValueFormatter = useAttrValueFormatter();
  const tableCells = useTableCells();
  const h = createColumnHelper<Attribute>();

  function getAttributeTypeString(attr: Attribute) {
    if (attr.type === "dict") {
      return `dict: ${attr.dictionary!.name}`;
    } else if (attr.typeModel) {
      return `model: ${attr.typeModel}`;
    } else {
      return attr.type;
    }
  }

  function textSort<T>() {
    return {
      sortingFn: (a, b, colId) => ((a.getValue(colId) || "") as string).localeCompare(b.getValue(colId) || ""),
    } satisfies Partial<IdentifiedColumnDef<T>>;
  }

  const table = createMemo(() =>
    createSolidTable({
      ...getBaseTableOptions<Attribute>({
        features: {
          sorting: [{id: "Name", desc: false}],
          pagination: {pageIndex: 0, pageSize: 1e6},
        },
        defaultColumn: AUTO_SIZE_COLUMN_DEFS,
      }),
      get data() {
        return [...(attributes() || [])];
      },
      columns: [
        h.accessor((p) => p.resource.defaultOrder, {
          id: "Order",
          cell: cellFunc<number, Attribute>((props) => <PaddedCell class="text-right">{props.v}</PaddedCell>),
          sortDescFirst: false,
        }),
        h.accessor("id", {
          id: "Id",
          cell: tableCells.uuid(),
          enableSorting: false,
          size: 60,
        }),
        h.accessor("name", {
          id: "Name",
          ...textSort(),
        }),
        h.accessor("label", {
          id: "Label",
          cell: cellFunc<string, Attribute>((props) => <PaddedCell class="italic">{props.v}</PaddedCell>),
          ...textSort(),
        }),
        h.accessor("resource.facilityId", {
          id: "Facility",
          cell: cellFunc<string, Attribute>((props) => (
            <PaddedCell>
              <ShowCellVal v={props.v}>{(v) => getFacility(v())}</ShowCellVal>
            </PaddedCell>
          )),
          ...textSort(),
        }),
        h.accessor("isFixed", {
          id: "Fixed",
        }),
        h.accessor("model", {
          id: "Model",
          ...textSort(),
          header: (ctx) => (
            <Header
              ctx={ctx}
              filter={[ctx.column.getFilterValue, ctx.column.setFilterValue as Setter<unknown>]}
              filterControl={
                <Select
                  name="modelFilter"
                  items={models().map((model) => ({value: model}))}
                  // Clearable by the "reset filter" button in the header.
                  nullable={false}
                  onValueChange={ctx.column.setFilterValue}
                  small
                />
              }
            />
          ),
          filterFn: (row, columnId, filter: string) => row.getValue(columnId) === filter,
        }),
        h.accessor("apiName", {
          id: "API name",
          ...textSort(),
        }),
        h.accessor("type", {
          id: "Type",
          cell: cellFunc<AttributeType, Attribute>((props) => (
            <PaddedCell>{getAttributeTypeString(props.row)}</PaddedCell>
          )),
          ...textSort(),
        }),
        h.accessor("multiple", {
          id: "Multiple",
          cell: cellFunc<boolean, Attribute>((props) => (
            <PaddedCell>
              <ShowCellVal v={props.v} fallback={EMPTY_VALUE_SYMBOL}>
                {(v) => String(v())}
              </ShowCellVal>
            </PaddedCell>
          )),
        }),
        h.accessor("requirementLevel", {
          id: "Req. level",
          ...textSort(),
        }),
        ...(attributes()
          ?.getForModel("attribute")
          .map((attr) =>
            h.accessor((row) => attr.readFrom(row.resource), {
              id: `@${attr.name}`,
              cell: (ctx) => <PaddedCell>{attrValueFormatter(attr, ctx.getValue())}</PaddedCell>,
            }),
          ) || []),
      ],
    }),
  );

  return (
    <QueryBarrier queries={[facilitiesQuery]}>
      <MemoTitle title="Attributes" />
      <div class="contents text-sm">
        <Show when={attributes()} fallback={<BigSpinner />}>
          <Table table={table()} mode="standalone" />
        </Show>
      </div>
    </QueryBarrier>
  );
}) satisfies VoidComponent;
