import {useParams} from "@solidjs/router";
import {createQuery} from "@tanstack/solid-query";
import {BigSpinner} from "components/ui/Spinner";
import {QueryBarrier} from "components/utils";
import {FacilityClient} from "data-access/memo-api/groups/FacilityClient";
import {UserDetailsHeader} from "features/facility-users/UserDetailsHeader";
import {UserMeetingsTables} from "features/facility-users/UserMeetingsTables";
import {Show, VoidComponent} from "solid-js";

export default (() => {
  const params = useParams();
  const userId = () => params.userId!;
  const dataQuery = createQuery(() => FacilityClient.clientQueryOptions(userId()));
  return (
    <div class="m-2">
      <QueryBarrier queries={[dataQuery]} ignoreCachedData>
        <Show when={dataQuery.data} fallback={<BigSpinner />}>
          {(user) => (
            <div class="flex flex-col items-stretch gap-2">
              <UserDetailsHeader type="clients" user={user()} />
              <UserMeetingsTables
                intrinsicFilter={{
                  type: "column",
                  column: "clients.*.userId",
                  op: "has",
                  val: userId(),
                }}
                staticPersistenceKey="clientMeetings"
              />
            </div>
          )}
        </Show>
      </QueryBarrier>
    </div>
  );
}) satisfies VoidComponent;
