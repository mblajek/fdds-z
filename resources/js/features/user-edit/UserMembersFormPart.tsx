import {createMutation, createQuery} from "@tanstack/solid-query";
import {createColumnHelper, createSolidTable} from "@tanstack/solid-table";
import {AxiosResponse} from "axios";
import {useFormContext} from "components/felte-form/FelteForm";
import {Button} from "components/ui/Button";
import {Capitalize} from "components/ui/Capitalize";
import {
  AUTO_SIZE_COLUMN_DEFS,
  PaddedCell,
  Table,
  createTableTranslations,
  getBaseTableOptions,
  useTableCells,
} from "components/ui/Table";
import {Select} from "components/ui/form/Select";
import {FACILITY_ICONS} from "components/ui/icons";
import {useLangFunc} from "components/utils";
import {Admin, System} from "data-access/memo-api/groups";
import {AdminUserResource} from "data-access/memo-api/resources/adminUser.resource";
import {MemberResource} from "data-access/memo-api/resources/member.resource";
import {Api} from "data-access/memo-api/types";
import {byId} from "data-access/memo-api/utils";
import {Show, VoidComponent, createMemo} from "solid-js";
import {z} from "zod";

export const getSchema = () =>
  z.array(
    z.object({
      facilityId: z.string(),
      hasFacilityAdmin: z.boolean(),
      isFacilityStaff: z.boolean(),
      isFacilityClient: z.boolean(),
    }),
  );

export type Input = z.input<ReturnType<typeof getSchema>>;
export type Output = z.output<ReturnType<typeof getSchema>>;

interface MemberRow {
  /** Member information, or undefined for the new member row. */
  readonly member:
    | Pick<MemberResource, "facilityId" | "hasFacilityAdmin" | "isFacilityStaff" | "isFacilityClient">
    | undefined;
}

interface Props {
  /** The path in the form under which the members are stored. */
  readonly membersPath: string;
}

/** Part of the user form responsible for editing facility membership. */
export const UserMembersFormPart: VoidComponent<Props> = (props) => {
  // eslint-disable-next-line solid/reactivity
  const {membersPath} = props;
  // A trick: we assume the form has only the key specified by membersPath, and it's of type Input.
  const {form} = useFormContext<Record<typeof membersPath, Input>>();
  const t = useLangFunc();
  const translations = createTableTranslations("userFacilityMember");
  const facilitiesQuery = createQuery(System.facilitiesQueryOptions);
  const facilitiesById = createMemo(() => byId(facilitiesQuery.data));
  /** A list of facilities that are not yet present in any row. Only those can be added. */
  const freeFacilities = createMemo(() => {
    const facilities = new Map(facilitiesById());
    for (const {facilityId} of form.data(membersPath)) {
      facilities.delete(facilityId);
    }
    return [...facilities.values()].sort((a, b) => a.name.localeCompare(b.name));
  });
  const data = createMemo<MemberRow[]>(() => {
    const rows: MemberRow[] = [];
    for (const member of form.data(membersPath)) {
      rows.push({member});
    }
    if (freeFacilities().length) {
      rows.push({member: undefined});
    }
    return rows;
  });
  const tableCells = useTableCells();
  const h = createColumnHelper<MemberRow>();
  const table = createSolidTable<MemberRow>({
    ...getBaseTableOptions<MemberRow>({
      features: {columnVisibility: {isNewRow: false}},
      defaultColumn: {
        ...AUTO_SIZE_COLUMN_DEFS,
        enableSorting: false,
      },
    }),
    get data(): MemberRow[] {
      return data();
    },
    columns: [
      h.accessor((row) => !row.member, {
        id: "isNewRow",
      }),
      h.accessor((row) => row.member && facilitiesById().get(row.member.facilityId)?.name, {
        id: "facility",
        cell: (ctx) => (
          <Show
            when={ctx.row.getValue("isNewRow")}
            // For existing rows, display the facility name.
            fallback={tableCells.default<MemberRow>()(ctx)}
          >
            {/* For the new row, display a select with the available facilities. */}
            <PaddedCell>
              <Select
                name="__addedFacility"
                label=""
                placeholder={t("actions.add")}
                aria-label={t("models.userFacilityMember.facility")}
                items={[...freeFacilities().map(({id, name}) => ({value: id, text: name}))]}
                onFilterChange="internal"
                nullable
                onValueChange={(facilityId) => {
                  if (facilityId) {
                    // When something is selected, convert this to an existing row.
                    const newRow: Input[number] = {
                      facilityId,
                      hasFacilityAdmin: false,
                      isFacilityStaff: false,
                      isFacilityClient: false,
                    };
                    // The form trick causes type problems here, for some reason expecting array as
                    // the second parameter.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    form.addField(membersPath, newRow as any);
                  }
                }}
                small
              />
            </PaddedCell>
          </Show>
        ),
      }),
      ...(["hasFacilityAdmin", "isFacilityStaff", "isFacilityClient"] as const).map((field) =>
        h.accessor((row) => row.member?.[field], {
          id: field,
          cell: (ctx) => (
            <Show when={!ctx.row.getValue("isNewRow")}>
              <PaddedCell class="text-center">
                <input type="checkbox" name={`${membersPath}.${ctx.row.index}.${field}`} data-felte-keep-on-remove />
              </PaddedCell>
            </Show>
          ),
        }),
      ),
      h.display({
        id: "actions",
        cell: (ctx) => (
          <PaddedCell>
            <Show when={!ctx.row.getValue("isNewRow")}>
              <Button
                class="minimal"
                onClick={() => {
                  const {index} = ctx.row;
                  form.setFields(membersPath, form.data(membersPath).toSpliced(index, 1));
                }}
              >
                <FACILITY_ICONS.remove class="inlineIcon" /> {t("actions.delete")}
              </Button>
            </Show>
          </PaddedCell>
        ),
      }),
    ],
    enableColumnResizing: false,
    meta: {translations},
  });
  return (
    <div>
      <Capitalize class="font-medium" text={translations.tableName()} />
      <Table table={table} />
    </div>
  );
};

interface MembersUpdater {
  /**
   * Returns promises responsible for bringing the members from the old state (specified in oldUser)
   * to the new state (specified by the form values).
   */
  getUpdatePromises(oldUser: AdminUserResource, values: Output): Promise<AxiosResponse>[];
  /** Returns promises responsible for creating the specified members. */
  getCreatePromises(userId: Api.Id, values: Output): Promise<AxiosResponse>[];
}

export function useMembersUpdater(): MembersUpdater {
  const createMemberMutation = createMutation(() => ({mutationFn: Admin.createMember, meta: {isFormSubmit: true}}));
  const updateMemberMutation = createMutation(() => ({mutationFn: Admin.updateMember, meta: {isFormSubmit: true}}));
  const deleteMemberMutation = createMutation(() => ({mutationFn: Admin.deleteMember, meta: {isFormSubmit: true}}));
  return {
    getUpdatePromises: (oldUser, values) => {
      const promises = [];
      for (const member of values) {
        const oldMember = oldUser.members.find(({facilityId}) => facilityId === member.facilityId);
        if (oldMember) {
          if (isChanged(oldMember, member))
            promises.push(updateMemberMutation.mutateAsync({id: oldMember.id, ...member}));
        } else promises.push(createMemberMutation.mutateAsync({userId: oldUser.id, ...member}));
      }
      for (const oldMember of oldUser.members)
        if (!values.some(({facilityId}) => facilityId === oldMember.facilityId))
          promises.push(deleteMemberMutation.mutateAsync(oldMember.id));
      return promises;
    },
    getCreatePromises: (userId, values) =>
      values.map((member) => createMemberMutation.mutateAsync({userId: userId, ...member})),
  };
}

export function isUpdateDestructive(initialValues: Output, values: Output) {
  return initialValues.some((oldMember) => {
    const newMember = values.find(({facilityId}) => facilityId === oldMember.facilityId);
    return (["isFacilityStaff", "isFacilityClient"] as const).some((field) => oldMember[field] && !newMember?.[field]);
  });
}

/**
 * Checks whether the member entry is modified. The two member entries are for the same
 * user and facility, only other fields should be compared.
 */
function isChanged(oldMember: MemberResource, newMember: Output[number]) {
  return (["hasFacilityAdmin", "isFacilityStaff", "isFacilityClient"] as const).some(
    (field) => oldMember[field] !== newMember[field],
  );
}
