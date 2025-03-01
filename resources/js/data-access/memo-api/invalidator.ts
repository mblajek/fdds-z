import {useQueryClient} from "@tanstack/solid-query";
import {System} from "data-access/memo-api/groups/System";
import {User} from "data-access/memo-api/groups/User";
import {createSignal, untrack} from "solid-js";
import {FacilityClientGroup} from "./groups/FacilityClientGroup";
import {FacilityMeeting} from "./groups/FacilityMeeting";
import {FacilityUsers} from "./groups/FacilityUsers";
import {Facilities, Users} from "./groups/shared";

const INVALIDATE_EVERYTHING_LOOP_INTERVAL_MILLIS = 3000;

const [throttled, setThrottled] = createSignal(false);

export function useInvalidator(queryClient = useQueryClient()) {
  const invalidate = {
    everything: () => {
      queryClient.invalidateQueries();
      setThrottled(true);
      setTimeout(() => setThrottled(false), INVALIDATE_EVERYTHING_LOOP_INTERVAL_MILLIS);
    },
    everythingThrottled: () => {
      if (untrack(throttled)) {
        return false;
      }
      invalidate.everything();
      return true;
    },
    isThrottled: throttled,
    resetEverything: () => {
      queryClient.resetQueries();
    },
    // Shared:
    users: () => queryClient.invalidateQueries({queryKey: Users.keys.user()}),
    facilities: () => queryClient.invalidateQueries({queryKey: Facilities.keys.facility()}),
    // User status:
    userStatusAndFacilityPermissions: ({clearCache = false} = {}) => {
      if (clearCache) {
        queryClient.resetQueries({queryKey: User.keys.statusAll()});
      } else {
        queryClient.invalidateQueries({queryKey: User.keys.statusAll()});
      }
    },
    // System status:
    systemStatus: () => queryClient.invalidateQueries({queryKey: System.keys.status()}),
    // Facility resources:
    facility: {
      meetings: () => queryClient.invalidateQueries({queryKey: FacilityMeeting.keys.meeting()}),
      users: () => queryClient.invalidateQueries({queryKey: FacilityUsers.keys.user()}),
      clientGroups: () => {
        invalidate.facility.users();
        queryClient.invalidateQueries({queryKey: FacilityClientGroup.keys.clientGroup()});
      },
    },
    // Global:
    dictionaries: () => queryClient.invalidateQueries({queryKey: System.keys.dictionary()}),
    attributes: () => queryClient.invalidateQueries({queryKey: System.keys.attribute()}),
  };
  return invalidate;
}
