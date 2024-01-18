import {activeFacilityId} from "state/activeFacilityId.state";
import {V1} from "../config";
import {SolidQueryOpts} from "../query_utils";
import {StaffResource} from "../resources/staff.resource";
import {Api} from "../types";
import {ListInParam, createGetFromList, createListRequest, parseGetListResponse} from "../utils";
import {Users} from "./shared";

/**
 * @see {@link https://test-memo.fdds.pl/api/documentation#/Facility%20staff production docs}
 * @see {@link http://localhost:9081/api/documentation#/Facility%20staff local docs}
 */
export namespace FacilityStaff {
  const getStaffListBase = (request?: Api.Request.GetListParams, config?: Api.Config) =>
    V1.get<Api.Response.GetList<StaffResource>>(`/facility/${activeFacilityId()}/user/staff/list`, {
      ...config,
      params: request,
    });
  const getStaffList = (request?: Api.Request.GetListParams, config?: Api.Config) =>
    getStaffListBase(request, config).then(parseGetListResponse);
  const getStaffMember = createGetFromList(getStaffListBase);

  export const keys = {
    staff: () => [...Users.keys.user(), "staff"] as const,
    staffList: (request?: Api.Request.GetListParams) => [...keys.staff(), "list", request, activeFacilityId()] as const,
    staffGet: (id: Api.Id) => [...keys.staff(), "list", createListRequest(id), activeFacilityId()] as const,
  };

  export const staffQueryOptions = (ids: ListInParam) => {
    const request = createListRequest(ids);
    return {
      queryFn: ({signal}) => getStaffList(request, {signal}),
      queryKey: keys.staffList(request),
    } satisfies SolidQueryOpts<StaffResource[]>;
  };

  export const staffMemberQueryOptions = (id: Api.Id) =>
    ({
      queryFn: ({signal}) => getStaffMember(id, {signal}),
      queryKey: keys.staffGet(id),
    }) satisfies SolidQueryOpts<StaffResource>;
}
