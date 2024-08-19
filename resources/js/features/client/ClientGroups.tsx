import {createQuery} from "@tanstack/solid-query";
import {Button} from "components/ui/Button";
import {Capitalize} from "components/ui/Capitalize";
import {StandaloneFieldLabel} from "components/ui/form/FieldLabel";
import {Select} from "components/ui/form/Select";
import {actionIcons, clientGroupIcons} from "components/ui/icons";
import {SmallSpinner} from "components/ui/Spinner";
import {EmptyValueSymbol} from "components/ui/symbols";
import {htmlAttributes, QueryBarrier, useLangFunc} from "components/utils";
import {FacilityClientGroup} from "data-access/memo-api/groups/FacilityClientGroup";
import {ClientResource} from "data-access/memo-api/resources/client.resource";
import {TbArrowBadgeRight} from "solid-icons/tb";
import {createComputed, createSignal, JSX, ParentComponent, Show, VoidComponent} from "solid-js";
import {createAddToClientGroupModal} from "./add_to_client_group_modal";
import {createClientGroupCreateModal} from "./client_group_create_modal";
import {ClientGroupLabel} from "./ClientGroupLabel";
import {ClientGroupViewEditForm} from "./ClientGroupViewEditForm";
import {ClientGroupResource} from "data-access/memo-api/resources/clientGroup.resource";

interface Props {
  readonly client: ClientResource;
  readonly onGroupChange?: (group: ClientGroupResource | undefined, isFetching: boolean) => void;
  /** Whether the component allows editing and creating groups (as opposed to just viewing). Default: false */
  readonly allowEditing?: boolean;
  readonly noGroupsText?: () => JSX.Element;
}

export const ClientGroups: VoidComponent<Props> = (props) => {
  const t = useLangFunc();
  const clientGroupCreateModal = createClientGroupCreateModal();
  const addToClientGroupModal = createAddToClientGroupModal();
  const groupIds = () => props.client.client.groupIds || [];
  const dataQuery = createQuery(() => ({
    ...FacilityClientGroup.clientGroupsQueryOptions(groupIds()),
    enabled: groupIds().length > 0,
  }));

  const CreateGroupButton: ParentComponent<htmlAttributes.button> = (buttonProps) => (
    <Button
      {...htmlAttributes.merge(buttonProps, {class: "secondary small"})}
      onClick={() =>
        clientGroupCreateModal.show({
          initialValues: {
            clients: [{userId: props.client.id, role: ""}],
          },
          currentClientId: props.client.id,
        })
      }
    >
      <actionIcons.Add class="inlineIcon" />
      <clientGroupIcons.ClientGroup class="inlineIcon -ml-0.5" /> {buttonProps.children}
    </Button>
  );

  const AddToClientGroupButton: ParentComponent<htmlAttributes.button> = (buttonProps) => (
    <Button
      {...htmlAttributes.merge(buttonProps, {class: "secondary small"})}
      onClick={() => addToClientGroupModal.show({clientId: props.client.id})}
    >
      <TbArrowBadgeRight class="inlineIcon strokeIcon" />
      <clientGroupIcons.ClientGroup class="inlineIcon -ml-0.5" /> {buttonProps.children}
    </Button>
  );

  const [selectedGroupId, setSelectedGroupId] = createSignal<string | undefined>();
  createComputed(() => {
    if (!groupIds().length) {
      setSelectedGroupId(undefined);
    } else if (!selectedGroupId() || !groupIds().includes(selectedGroupId()!)) {
      setSelectedGroupId(groupIds()[0]);
    }
  });
  createComputed(() =>
    props.onGroupChange?.(
      dataQuery.data?.find(({id}) => id === selectedGroupId()),
      dataQuery.isFetching,
    ),
  );
  return (
    <div class="flex flex-col gap-1">
      <div class="flex justify-between items-center gap-2">
        <div class="flex gap-1 items-center">
          <clientGroupIcons.ClientGroup size="22" />
          <StandaloneFieldLabel>
            <Capitalize
              text={t("facility_user.client_group__interval", {postProcess: "interval", count: groupIds().length})}
            />
          </StandaloneFieldLabel>
        </div>
        <Show when={props.allowEditing && groupIds().length}>
          <CreateGroupButton title={t("actions.client_group.add_another")} />
        </Show>
      </div>
      <Show
        when={groupIds().length}
        fallback={
          <>
            {props.noGroupsText?.() ?? <EmptyValueSymbol />}
            <Show when={props.allowEditing}>
              <div class="flex gap-1">
                <CreateGroupButton>{t("actions.client_group.add")}</CreateGroupButton>
                <AddToClientGroupButton>{t("actions.client_group.add_to")}</AddToClientGroupButton>
              </div>
            </Show>
          </>
        }
      >
        <QueryBarrier queries={[dataQuery]}>
          <Show when={groupIds().length > 1}>
            <Select
              name="selectedGroupId"
              label=""
              items={groupIds().map((groupId) => ({
                value: groupId,
                label: () => (
                  <Show
                    when={dataQuery.data!.find(({id}) => id === groupId)}
                    fallback={
                      // The group can only be missing as a result of a race.
                      <SmallSpinner />
                    }
                  >
                    {(group) => <ClientGroupLabel group={group()} />}
                  </Show>
                ),
              }))}
              value={selectedGroupId()}
              onValueChange={setSelectedGroupId}
              nullable={false}
              small
            />
          </Show>
          <Show when={dataQuery.data!.find(({id}) => id === selectedGroupId())} fallback={<EmptyValueSymbol />}>
            {(group) => (
              <ClientGroupViewEditForm
                group={group()}
                currentClientId={props.client.id}
                allowEditing={props.allowEditing}
              />
            )}
          </Show>
        </QueryBarrier>
      </Show>
    </div>
  );
};
