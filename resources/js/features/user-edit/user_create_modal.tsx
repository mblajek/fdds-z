import {MODAL_STYLE_PRESETS, Modal} from "components/ui/Modal";
import {useLangFunc} from "components/utils";
import {registerGlobalPageElement} from "components/utils/GlobalPageElements";
import {lazy} from "solid-js";

const UserCreateForm = lazy(() => import("features/user-edit/UserCreateForm"));

export const createUserCreateModal = registerGlobalPageElement<true>((args) => {
  const t = useLangFunc();
  return (
    <Modal
      title={t("forms.user_create.formName")}
      open={args.params()}
      closeOn={["escapeKey", "closeButton"]}
      onClose={args.clearParams}
      style={MODAL_STYLE_PRESETS.medium}
    >
      <UserCreateForm onSuccess={args.clearParams} onCancel={args.clearParams} />
    </Modal>
  );
});