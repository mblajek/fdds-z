export type ColumnName = string;
export type CustomFilterName = string;

/** Parameters of a custom filter, defined for each custom filter separately. */
export type CustomFilterParams = Record<string, unknown>;

/** Date string in ISO format. */
export type DateString = string;
/** Date time string in ISO format in UTC. */
export type DateTimeString = string;

type Mapping<Key extends string, Value> = Readonly<Partial<Record<Key, Value>>>;

export interface Schema {
  readonly columns: readonly ColumnSchema[];
  readonly customFilters?: Mapping<CustomFilterName, CustomFilter>;
}

export type ColumnSchema = DataColumnSchema | CountColumnSchema;

interface DataColumnSchemaBase {
  readonly name: ColumnName;
  readonly nullable: boolean;
  /** The attribute defining this data column. */
  readonly attributeId?: string;
  /** If specified, this column is a transformation of another column. */
  readonly transform?: string;
}

export type DataColumnSchema = PlainDataColumnSchema | DictDataColumnSchema;

interface PlainDataColumnSchema extends DataColumnSchemaBase {
  readonly type:
    | "bool"
    | "date"
    | "datetime"
    | "int"
    // A list of objects of a form known both to backend and frontend.
    | "list"
    // An object of a form known both to backend and frontend.
    | "object"
    | "string"
    | "string_list"
    | "text"
    | "uuid"
    | "uuid_list";
}

export interface DictDataColumnSchema extends DataColumnSchemaBase {
  readonly type: "dict" | "dict_list";
  readonly dictionaryId: string;
}

export interface CountColumnSchema {
  readonly name: ColumnName;
  readonly type: "count";
}

export interface CustomFilter {
  /** Hint for the frontend on where to place the UI element. */
  readonly associatedColumn: ColumnName;
}

export interface DataRequest {
  readonly columns: readonly Column[];
  readonly filter?: ConstFilter | Filter;
  readonly sort: Sort;
  readonly paging: Paging;
  /** Whether to only return distinct values. This also enables a count column. */
  readonly distinct?: boolean;
}

// TODO: Consider custom columns.
export type Column = DataColumn;

export interface DataColumn {
  readonly type: "column";
  readonly column: ColumnName;
}

/** A filter that matches everything / doesn't match anything. Only valid at the top level. */
export type ConstFilter = "always" | "never";

export type Filter = BoolOpFilter | ColumnFilter | CustomFilter;

export interface FilterBase {
  /** Whether to reverse the result of the filter. This is applicable to all filters. */
  readonly inv?: boolean;
}

/**
 * A filter that performs a boolean _and_ or _or_ operation on the specified filters.
 * - If op is `"&"`, this matches if all of the filters in val match.
 * - If op is `"|"`, this matches if any of the filters in val match.
 */
export interface BoolOpFilter extends FilterBase {
  readonly type: "op";
  readonly op: "&" | "|";
  /** List of sub-filters. Cannot be empty. */
  readonly val: readonly Filter[];
}

export type ColumnFilter = NullColumnFilter | ColumnValueFilter;
export type ColumnValueFilter =
  | BoolColumnFilter
  | DateColumnFilter
  | DateTimeColumnFilter
  | IntColumnFilter
  | ListColumnFilter
  | ObjectColumnFilter
  | StringColumnFilter
  | TextColumnFilter
  | UuidColumnFilter
  | UuidListColumnFilter
  | DictColumnFilter
  | DictListColumnFilter;

interface ColumnFilterBase extends FilterBase {
  readonly type: "column";
  readonly column: ColumnName;
}

/** A filter matching only null values. It is invalid for non-nullable columns. */
export interface NullColumnFilter extends ColumnFilterBase {
  readonly op: "null";
}

interface EqColumnFilter<T> extends ColumnFilterBase {
  readonly op: "=";
  /** The value to compare to. Cannot be empty string. */
  readonly val: T;
}
interface BinEqColumnFilter<T> extends ColumnFilterBase {
  readonly op: "==";
  /** The value to compare to. Cannot be empty string. */
  readonly val: T;
}
interface InColumnFilter<T> extends ColumnFilterBase {
  readonly op: "in";
  /** The values to compare to. Cannot contain an empty string. */
  readonly val: readonly T[];
}
interface CmpColumnFilter<T> extends ColumnFilterBase {
  readonly op: ">" | "<" | ">=" | "<=";
  /** The value to compare to. Cannot be empty string. */
  readonly val: T;
}
/** A filter that matches a part of a textual column. */
interface ContainsColumnFilter extends ColumnFilterBase {
  /** Whether the val should appear at the end of the matched string, at the beginning, or anywhere. */
  readonly op: "%v" | "v%" | "%v%";
  /** The value that needs to appear in the searched string. Cannot be empty. */
  readonly val: string;
}
/** A filter that matches a textual column with a LIKE expression. */
interface LikeColumnFilter extends ColumnFilterBase {
  readonly op: "lv";
  /** The LIKE pattern with % denoting any number of characters and _ denoting any single character. */
  readonly val: string;
}
interface RegexpColumnFilter extends ColumnFilterBase {
  readonly op: "/v/";
  /** The regexp pattern to match. Cannot be empty. */
  readonly val: string;
}
interface HasColumnFilter<T> extends ColumnFilterBase {
  readonly op: "has";
  readonly val: T;
}
interface SetsOpColumnFilter<T> extends ColumnFilterBase {
  readonly op: SetsOp;
  readonly val: readonly T[];
}
export type SetsOp = "has_all" | "has_any" | "has_only";

export type BoolColumnFilter = EqColumnFilter<boolean>;
export type DateColumnFilter = EqColumnFilter<DateString> | InColumnFilter<DateString> | CmpColumnFilter<DateString>;
export type DateTimeColumnFilter = CmpColumnFilter<DateString>;
export type IntColumnFilter =
  | EqColumnFilter<number>
  | InColumnFilter<number>
  | CmpColumnFilter<number>
  | ContainsColumnFilter
  | LikeColumnFilter;
export type ListColumnFilter = never;
export type ObjectColumnFilter = never;
export type StringColumnFilter =
  | EqColumnFilter<string>
  | BinEqColumnFilter<string>
  | InColumnFilter<string>
  | CmpColumnFilter<string>
  | ContainsColumnFilter
  | LikeColumnFilter
  | RegexpColumnFilter;
export type TextColumnFilter = ContainsColumnFilter | LikeColumnFilter | RegexpColumnFilter;
export type UuidColumnFilter = EqColumnFilter<string> | InColumnFilter<string>;
export type UuidListColumnFilter =
  | EqColumnFilter<readonly string[]>
  | HasColumnFilter<string>
  | SetsOpColumnFilter<string>;
export type DictColumnFilter = EqColumnFilter<string> | InColumnFilter<string>;
export type DictListColumnFilter =
  | EqColumnFilter<readonly string[]>
  | HasColumnFilter<string>
  | SetsOpColumnFilter<string>;

export interface CustomFilter extends FilterBase {
  readonly type: "custom";
  readonly customFilter: CustomFilterName;
  readonly params: CustomFilterParams;
}

export interface Paging {
  /** The number of requested records. */
  readonly size: number;
  /** The one-based page number. */
  readonly number?: number;
  /** The zero-based index of the first record to return. */
  readonly offset?: number;
}

export interface DataResponse {
  readonly meta: DataResponseMeta;
  readonly data: readonly DataItem[];
}

export interface DataResponseMeta {
  /** Number of records across all pages of results. */
  readonly totalDataSize: number;
}

export type DataItem = Mapping<ColumnName, unknown>;

/** Specification of the data sorting. The first element has the highest priority. */
export type Sort = readonly SortItem[];

export type SortItem = SortColumn;

export interface SortColumn {
  readonly type: "column";
  readonly column: ColumnName;
  readonly desc?: boolean;
}

export type ColumnType = DataColumnSchema["type"];

export function isDataType(column: ColumnSchema["type"]): column is ColumnType {
  return column !== "count";
}

export function isDataColumn(column: ColumnSchema): column is DataColumnSchema {
  return isDataType(column.type);
}
