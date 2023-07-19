import cx from "classnames";
import {useLangFunc} from "components/utils";
import {Component, ParentProps, createComputed, createSignal} from "solid-js";
import {tableStyle, useTable} from ".";

interface Props {
  placeholder?: string;
}

export const TableSearch: Component<ParentProps<Props>> = props => {
  const t = useLangFunc();
  const table = useTable();
  const [query, setQuery] = createSignal(table.getState().globalFilter);
  createComputed(() => table.setGlobalFilter(query()));
  return <div class={cx(tableStyle.searchBar)}>
    <input
      type="search"
      placeholder={props.placeholder || t("tables.search")}
      value={query()}
      onInput={e => {
        e.preventDefault();
        setQuery(e.target.value);
      }}
    />
  </div>;
};