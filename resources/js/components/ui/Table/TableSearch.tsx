import {htmlAttributes, useLangFunc} from "components/utils";
import {ParentProps, VoidComponent, createComputed, createSignal, splitProps} from "solid-js";
import {useTable} from ".";

interface Props extends htmlAttributes.div {
  placeholder?: string;
}

export const TableSearch: VoidComponent<ParentProps<Props>> = (allProps) => {
  const [props, divProps] = splitProps(allProps, ["placeholder"]);
  const t = useLangFunc();
  const table = useTable();
  const [query, setQuery] = createSignal(table.getState().globalFilter);
  createComputed(() => table.setGlobalFilter(query()));
  return (
    <div {...divProps}>
      <input
        class="w-full h-full px-2 rounded border"
        name="table_global_search"
        type="search"
        placeholder={props.placeholder || t("tables.search")}
        value={query()}
        onInput={({target: {value}}) => setQuery(value)}
      />
    </div>
  );
};
