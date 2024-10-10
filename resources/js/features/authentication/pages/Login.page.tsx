import {useNavigate} from "@solidjs/router";
import {createQuery} from "@tanstack/solid-query";
import {MemoLoader} from "components/ui/MemoLoader";
import {Wrights} from "components/ui/Wrights";
import {currentTimeSecond, QueryBarrier} from "components/utils";
import {User} from "data-access/memo-api/groups";
import {useInvalidator} from "data-access/memo-api/invalidator";
import {useSystemStatusMonitor} from "features/system-status/system_status_monitor";
import {createEffect, onMount, VoidComponent} from "solid-js";
import {setActiveFacilityId} from "state/activeFacilityId.state";
import {createLoginModal} from "../forms/login/login_modal";

const INITIAL_PAGE = "/help";

/**
 * The login page.
 *
 * Possibly a temporary solution. The login modal can be displayed on top of any page, but it is
 * currently displayed as a separate page that triggers the modal on query error and redirects
 * otherwise.
 */
export default (() => {
  const navigate = useNavigate();
  const statusQuery = createQuery(User.statusQueryOptions);
  const systemStatusMonitor = useSystemStatusMonitor();
  const invalidate = useInvalidator();
  onMount(() => setActiveFacilityId(undefined));
  const loginModal = createLoginModal();
  createEffect(() => {
    if (systemStatusMonitor.needsReload()) {
      // If on the login screen, just reload without asking.
      location.reload();
    } else if (statusQuery.isError && !loginModal.isShown()) {
      loginModal.show({
        lightBackdrop: true,
        onSuccess: () => {
          invalidate.everythingThrottled();
          invalidate.userStatusAndFacilityPermissions({clearCache: true});
          navigate(INITIAL_PAGE);
        },
      });
    } else if (statusQuery.isSuccess) {
      navigate(INITIAL_PAGE);
    }
  });
  return (
    <>
      <LoginBackground />
      <QueryBarrier
        queries={[statusQuery]}
        ignoreCachedData
        // Do not show any errors, instead just show this login form.
        error={() => undefined}
        pending={() => undefined}
      >
        <MemoLoader />
      </QueryBarrier>
    </>
  );
}) satisfies VoidComponent;

const LoginBackground: VoidComponent = () => {
  const START_AFTER_SECS = 10 * 60;
  const t0 = currentTimeSecond();
  return (
    <Wrights
      class="fixed inset-0"
      levels={7}
      paused={currentTimeSecond().toMillis() < t0.toMillis() + START_AFTER_SECS * 1000}
    />
  );
};
