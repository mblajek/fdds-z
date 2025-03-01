import {useAppContext} from "app_context";
import {Accessor} from "solid-js";

/**
 * Creates a cached state. A typical use case is caching a memo which depends on a query. Without caching,
 * the query would be subscribed to multiple times, possibly hundreds of times if used in a small component,
 * and TanStack Query cache performance will affect the page performance.
 *
 * The creator function is called within the app context, so it has access to the query client and other
 * providers, but it will not be disposed of when the calling component is destroyed.
 */
export function createCached<T>(creator: Accessor<T>) {
  let data: T | undefined;
  return () => {
    if (data === undefined) {
      data = useAppContext().runInAppContext(creator);
    }
    return data;
  };
}
