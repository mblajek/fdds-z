import {SolidQueryOptions, useQueryClient} from "@tanstack/solid-query";
import {V1} from "../config";
import {PermissionsResource, UserResource} from "../resources";
import {MemberResource} from "../resources/member.resource";
import {Api} from "../types";
import {parseGetResponse} from "../utils";

/**
 * @see {@link https://test-memo.fdds.pl/api/documentation#/User production docs}
 * @see {@link http://localhost:9081/api/documentation#/User local docs}
 */
export namespace User {
  const getStatus = (facilityId?: string, config?: Api.Config) =>
    V1.get<Api.Response.Get<GetStatusData>>(facilityId ? `/user/status/${facilityId}` : "/user/status", config).then(
      parseGetResponse,
    );

  export const login = (data: LoginRequest, config?: Api.Config<LoginRequest>) =>
    V1.post<Api.Response.Post>("/user/login", data, config);

  export const logout = (config?: Api.Config) => V1.post<Api.Response.Post>("/user/logout", {}, config);

  export const changePassword = (data: ChangePasswordRequest, config?: Api.Config) =>
    V1.post<Api.Response.Post>("/user/password", data, config);

  export type GetStatusData = {
    user: UserResource;
    permissions: PermissionsResource;
    members: MemberResource[];
  };

  export type LoginRequest = {
    email: string;
    password: string;
  };

  export type ChangePasswordRequest = {
    current: string;
    password: string;
    repeat: string;
  };

  export const keys = {
    all: () => ["user"] as const,
    statusAll: () => [...keys.all(), "status"] as const,
    status: (facilityId?: string) => [...keys.statusAll(), facilityId] as const,
  };

  type PermissionsFacilityKeys = "facilityId" | "facilityMember" | "facilityClient" | "facilityStaff" | "facilityAdmin";
  // Ensure these are really keys.
  type _FacilityPermissions = Pick<PermissionsResource, PermissionsFacilityKeys>;

  export type GetStatusWithoutFacilityData = {
    user: UserResource;
    permissions: Omit<PermissionsResource, PermissionsFacilityKeys>;
    members: MemberResource[];
  };

  const STATUS_QUERY_OPTIONS = {
    // Prevent refetching on every page.
    staleTime: 10 * 60 * 1000,
    // Prevent displaying toast when user is not logged in - the login page will be displayed.
    meta: {quietHTTPStatuses: [401]},
    // Refetch this on window focus. The refetch is not visible to the user, and ensures the status
    // is up to date.
    refetchOnWindowFocus: true,
  };

  /** Query options for user status, without facility permissions. */
  export const statusQueryOptions = () =>
    ({
      // As a possible optimisation, this query could try to reuse any query with facility permissions,
      // that happens to be active.
      queryFn: ({signal}): Promise<GetStatusWithoutFacilityData> => getStatus(undefined, {signal}),
      queryKey: keys.status(),
      ...STATUS_QUERY_OPTIONS,
    }) satisfies SolidQueryOptions<GetStatusWithoutFacilityData>;

  /** Query options for user status with facility permissions. */
  export const statusWithFacilityPermissionsQueryOptions = (facilityId: string) =>
    ({
      queryFn: ({signal}) => getStatus(facilityId, {signal}),
      queryKey: keys.status(facilityId),
      ...STATUS_QUERY_OPTIONS,
    }) satisfies SolidQueryOptions<GetStatusData>;

  export function useInvalidator() {
    const queryClient = useQueryClient();
    return {
      statusAndFacilityPermissions: () => queryClient.invalidateQueries({queryKey: keys.statusAll()}),
    };
  }
}
