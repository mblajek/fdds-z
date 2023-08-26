import {AxiosError, type AxiosResponse} from "axios";
import {Api} from "./types";

export const parseGetResponse = <T extends object>(res: AxiosResponse<Api.Response.Get<T>>) => res.data.data;

export const parseGetListResponse = <T extends Api.Entity>(res: AxiosResponse<Api.Response.GetList<T>>) =>
  res.data.data;

export const parsePostResponse = (res: AxiosResponse<Api.Response.Post>) => res.data.data;

/** An id or an array of id that can be passed to a list request. */
export type ListInParam = Api.Id | Api.Id[];

/**
 * Returns a list request. If the argument is an array, the ids are sorted to ensure deterministic
 * value, which makes the value suitable for a query key.
 */
export function createListRequest(inParam?: ListInParam): Api.Request.GetListParams {
  return Array.isArray(inParam) ? (inParam.length ? {in: inParam.toSorted().join(",")} : {}) : {in: inParam};
}

export function byId<T extends Api.Entity>(list: T[]): Partial<Record<Api.Id, T>> {
  const result: Partial<Record<Api.Id, T>> = {};
  for (const entity of list) {
    result[entity.id] = entity;
  }
  return result;
}

/**
 * Returns a function for getting entity by id, made from a list calling function.
 *
 * The get request uses list with the in param under the hood, and throws an appropriate
 * fake AxiosError if the entity is not found.
 */
export function createGetFromList<T extends Api.Entity>(
  getEntityListBase: (request: Api.Request.GetListParams) => Promise<AxiosResponse<Api.Response.GetList<T>>>,
) {
  return (id: Api.Id) =>
    getEntityListBase(createListRequest(id)).then((response) => {
      const [result] = response.data.data;
      if (!result) {
        throw new AxiosError("Entity not found", AxiosError.ERR_BAD_REQUEST, response.config, response.request, {
          ...response,
          data: {errors: [{code: "exception.not_found"}]} satisfies Api.ErrorResponse,
          status: 404,
          statusText: "NotFound",
        });
      }
      return result;
    });
}
