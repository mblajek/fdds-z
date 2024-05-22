import {useLangFunc} from "components/utils";
import {Show, VoidComponent} from "solid-js";
import {useTable} from ".";

interface Props {
  /**
   * Number of rows. Must be specified for backend tables where it cannot be taken from the
   * table object.
   */
  readonly rowsCount?: number;
}

export const TableSummary: VoidComponent<Props> = (props) => {
  const t = useLangFunc();
  const table = useTable();
  const count = () => props.rowsCount ?? table.getCoreRowModel().rows.length;
  return (
    <div class="flex items-center text-nowrap">
      <Show
        when={table.options.meta?.translations?.summary?.(
          count(),
          table.options.meta.tquery?.activeColumnGroups?.[0](),
          {defaultValue: ""},
        )}
        fallback={t("tables.tables.generic.summary", {count: count()})}
      >
        {(summary) => <>{summary()}</>}
      </Show>
    </div>
  );
};
