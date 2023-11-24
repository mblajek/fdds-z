import {createMutation} from "@tanstack/solid-query";
import {useLangFunc} from "components/utils";
import {Admin} from "data-access/memo-api/groups/Admin";
import {VoidComponent} from "solid-js";
import toast from "solid-toast";
import {UserForm, UserFormInput, UserFormOutput} from "./UserForm";
import {useMembersUpdater} from "./UserMembersFormPart";

interface Props {
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
}

export const UserCreateForm: VoidComponent<Props> = (props) => {
  const t = useLangFunc();
  const invalidate = Admin.useInvalidator();
  const userMutation = createMutation(() => ({
    mutationFn: Admin.createUser,
    meta: {isFormSubmit: true},
  }));
  const membersUpdater = useMembersUpdater();

  async function updateUser(values: UserFormOutput) {
    // First create the user fields (without the members).
    const {data} = await userMutation.mutateAsync({
      name: values.name,
      ...(values.email
        ? {
            email: values.email,
            hasEmailVerified: values.hasEmailVerified,
            ...(values.hasPassword && values.password
              ? {password: values.password, passwordExpireAt: null}
              : {password: null, passwordExpireAt: null}),
          }
        : {
            email: null,
            hasEmailVerified: false,
            password: null,
            passwordExpireAt: null,
          }),
      hasGlobalAdmin: values.hasGlobalAdmin,
    });
    // If the user mutation succeeded, await all the members mutations. Await all even if any of
    // them fails, otherwise invalidation might happen before the final changes.
    try {
      await Promise.allSettled(membersUpdater.getCreatePromises(data.data.id, values.members));
    } finally {
      // Invalidate the user even after partial success (e.g. only user creation succeeded),
      // or when there were no member mutations.
      invalidate.users();
    }
    toast.success(t("forms.user_create.success"));
    props.onSuccess?.();
  }

  const initialValues = () =>
    ({
      name: "",
      email: "",
      hasEmailVerified: false,
      hasPassword: false,
      password: "",
      // At least the members array is required, otherwise the members form part fails to realise
      // that it should be an array.
      members: [],
      hasGlobalAdmin: false,
    }) satisfies UserFormInput;

  return <UserForm id="user_create" initialValues={initialValues()} onSubmit={updateUser} onCancel={props.onCancel} />;
};

// For lazy loading
export default UserCreateForm;