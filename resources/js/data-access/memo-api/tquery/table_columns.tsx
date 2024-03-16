import {PaddedCell, ShowCellVal, cellFunc} from "components/ui/Table";
import {PartialColumnConfig} from "components/ui/Table/TQueryTable";
import {exportCellFunc} from "components/ui/Table/table_export_cells";
import {UuidSelectFilterControl} from "components/ui/Table/tquery_filters/UuidSelectFilterControl";
import {useModelQuerySpec} from "components/ui/Table/tquery_filters/model_query_specs";
import {NON_NULLABLE} from "components/utils";
import {objectRecursiveMerge} from "components/utils/object_merge";
import {Show} from "solid-js";

export class TableColumnsSet<C extends string, D extends Readonly<Record<C, PartialColumnConfig>>> {
  constructor(readonly columns: D) {}

  get(...cols: (C | PartialColumnConfig | [C, Partial<PartialColumnConfig>])[]): PartialColumnConfig[] {
    return cols.map((c) =>
      typeof c === "string"
        ? this.columns[c]
        : Array.isArray(c)
          ? objectRecursiveMerge<(typeof this.columns)[C]>(this.columns[c[0]], c[1] as Partial<D[C]>)
          : c,
    );
  }
}

export function useTableColumns() {
  const modelQuerySpecs = useModelQuerySpec();
  const columnsSet = new TableColumnsSet({
    createdAt: {name: "createdAt", columnDef: {sortDescFirst: true}, initialVisible: false},
    createdBy: {name: "createdBy.name", initialVisible: false},
    updatedAt: {name: "updatedAt", columnDef: {sortDescFirst: true}, initialVisible: false},
    updatedBy: {name: "updatedBy.name", initialVisible: false},
  });
  const globalAdminColumnsSet = new TableColumnsSet({
    ...columnsSet.columns,
    createdBy: {
      name: "createdBy.id",
      extraDataColumns: ["createdBy.name"],
      columnDef: {
        cell: cellFunc<string>((props) => (
          <PaddedCell>
            <ShowCellVal v={props.row["createdBy.name"]}>{(v) => <>{v()}</>}</ShowCellVal>
          </PaddedCell>
        )),
        size: undefined,
      },
      filterControl: (props) => (
        <Show when={modelQuerySpecs("user")}>
          {(querySpecs) => <UuidSelectFilterControl {...props} {...querySpecs()} />}
        </Show>
      ),
      metaParams: {textExportCell: exportCellFunc((v: string, ctx) => ctx.row["createdBy.name"] as string)},
      initialVisible: false,
    },
    updatedBy: {
      name: "updatedBy.id",
      extraDataColumns: ["updatedBy.name"],
      columnDef: {
        cell: cellFunc<string>((props) => (
          <PaddedCell>
            <ShowCellVal v={props.row["updatedBy.name"]}>{(v) => <>{v()}</>}</ShowCellVal>
          </PaddedCell>
        )),
        size: undefined,
      },
      filterControl: (props) => (
        <Show when={modelQuerySpecs("user")}>
          {(querySpecs) => <UuidSelectFilterControl {...props} {...querySpecs()} />}
        </Show>
      ),
      metaParams: {textExportCell: exportCellFunc((v: string, ctx) => ctx.row["updatedBy.name"] as string)},
      initialVisible: false,
    },
  });

  function getCreatedUpdatedColumns({includeCreatedBy = true, includeUpdatedBy = true, globalAdmin = false} = {}) {
    const set = globalAdmin ? globalAdminColumnsSet : columnsSet;
    return set.get(
      ...[
        "createdAt",
        includeCreatedBy ? "createdBy" : undefined,
        "updatedAt",
        includeUpdatedBy ? "updatedBy" : undefined,
      ].filter(NON_NULLABLE),
    );
  }

  return {
    columnsSet,
    globalAdminColumnsSet,
    getCreatedUpdatedColumns,
  };
}
