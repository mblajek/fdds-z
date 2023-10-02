import {A} from "@solidjs/router";
import {AUTO_SIZE_COLUMN_DEFS, createTableTranslations} from "components/ui";
import {TQueryTable} from "components/ui/Table/TQueryTable";
import {AccessBarrier, useLangFunc} from "components/utils";
import {Admin} from "data-access/memo-api/groups/Admin";
import {Component} from "solid-js";

export default (() => {
  const t = useLangFunc();
  return (
    <AccessBarrier roles={["globalAdmin"]}>
      <TQueryTable
        mode="standalone"
        staticPrefixQueryKey={Admin.keys.facilityLists()}
        staticEntityURL="admin/facility"
        staticTranslations={createTableTranslations("facilities")}
        intrinsicColumns={["id"]}
        initialColumnsOrder={["id", "name", "url", "createdAt", "updatedAt"]}
        initialVisibleColumns={["name", "url", "createdAt"]}
        initialSort={[{id: "name", desc: false}]}
        columnOptions={{
          name: {
            metaParams: {canControlVisibility: false},
          },
          url: {
            columnDef: {
              cell: (c) => {
                const href = () => `/${c.getValue()}`;
                return <A href={href()}>{href()}</A>;
              },
            },
          },
          createdAt: {
            columnDef: {
              sortDescFirst: true,
            },
            metaParams: {
              filtering: {
                useDateOnlyInputs: true,
              },
            },
          },
          updatedAt: {
            columnDef: {
              sortDescFirst: true,
            },
            metaParams: {
              filtering: {
                useDateOnlyInputs: true,
              },
            },
          },
        }}
      />
    </AccessBarrier>
  );
}) satisfies Component;