import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  createQuery,
  type MutationMeta,
  type QueryMeta,
} from "@tanstack/solid-query";
import {isAxiosError} from "axios";
import {System, User} from "data-access/memo-api";
import {Api} from "data-access/memo-api/types";
import {For, ParentComponent, Show, VoidComponent, createMemo} from "solid-js";
import toast from "solid-toast";
import {cx, useLangFunc} from ".";
import {MemoLoader} from "../ui";

/** A list of HTTP response status codes for which a toast should not be displayed. */
type QuietHTTPStatuses = number[];

declare module "@tanstack/query-core" {
  interface QueryMeta {
    quietHTTPStatuses?: QuietHTTPStatuses;
  }
  interface MutationMeta {
    quietHTTPStatuses?: QuietHTTPStatuses;
    isFormSubmit?: boolean;
  }
}

/**
 * Tanstack/solid-query initialization component
 *
 * Handles custom queryClient and queryCache initialization
 */
export const InitializeTanstackQuery: ParentComponent = (props) => {
  const t = useLangFunc();
  function toastErrors(error: Error, meta?: Partial<QueryMeta & MutationMeta>) {
    if (!isAxiosError<Api.ErrorResponse>(error)) return;
    const status = error.response?.status;
    if (!status || !meta?.quietHTTPStatuses?.includes(status)) {
      let errors = error.response?.data.errors;
      if (meta?.isFormSubmit) {
        // Validation errors will be handled by the form.
        errors = errors?.filter((e) => !Api.isValidationError(e));
      }
      if (errors?.length) {
        const errorMessages = errors.map((e) => {
          const params = {
            ...(Api.isValidationError(e) ? {attribute: e.field} : undefined),
            ...e.data,
          };
          const translated = () => t(e.code, params);
          function logWhenAvailable(first = false) {
            const text = translated();
            if (text) {
              console.warn(`Error toast shown: ${text}`);
            } else {
              if (first)
                console.warn(`Error toast shown (translations not ready): ${e.code} ${JSON.stringify(params)}`);
              // We're not in reactive scope, so use timeout to wait until the translations are available.
              setTimeout(logWhenAvailable, 500);
            }
          }
          logWhenAvailable(true);
          return translated;
        });
        toast.error(() => (
          <ul class={cx({"list-disc pl-6": errorMessages.length > 1})} style={{"overflow-wrap": "anywhere"}}>
            <For each={errorMessages}>{(msg) => <li>{msg()}</li>}</For>
          </ul>
        ));
      }
    }
  }
  const queryClient = createMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnReconnect: true,
            // When opening a page, reload data if it's older than a couple of seconds.
            staleTime: 5 * 1000,
            retry: false,
            // This is very important. The default reconcile algorithm somehow breaks the data and
            // reactivity in complicated ways. This line is basically `broken: false`.
            reconcile: false,
          },
        },
        queryCache: new QueryCache({
          onError(error, query) {
            toastErrors(error, query.meta);
          },
        }),
        mutationCache: new MutationCache({
          onError(error, _variables, _context, mutation) {
            toastErrors(error, mutation.meta);
          },
        }),
      }),
  );
  return (
    <QueryClientProvider client={queryClient()}>
      <InitQueries />
      {props.children}
    </QueryClientProvider>
  );
};

/** Initialize some of the required queries beforehand, but don't block on them. */
const InitQueries: VoidComponent = () => {
  const queries = [createQuery(System.facilitiesQueryOptions), createQuery(User.statusQueryOptions)];
  return (
    <Show when={queries.some((q) => q.isLoading)}>
      <MemoLoader />
    </Show>
  );
};
