import * as dialog from "@zag-js/dialog";
import {normalizeProps, useMachine} from "@zag-js/solid";
import {cx, useLangFunc} from "components/utils";
import {VsClose} from "solid-icons/vs";
import {
  Accessor,
  createComputed,
  createMemo,
  createRenderEffect,
  createSignal,
  createUniqueId,
  JSX,
  onCleanup,
  Show,
} from "solid-js";
import {Portal} from "solid-js/web";
import {Size, useResizeObserver, windowSize} from "../utils/resize_observer";
import {Button} from "./Button";
import s from "./Modal.module.scss";
import {ChildrenOrFunc, getChildrenElement} from "./children_func";

interface BaseProps<T> {
  readonly title?: string;
  /**
   * Style of the modal, mostly for specifying the size. When absent, a reasonable minimum width is used.
   */
  readonly style?: JSX.CSSProperties;
  /**
   * A value determining whether the modal is open. If truthy, the value is also available for the modal
   * children in its function form.
   *
   * The only way to close the modal is to set this to a falsy value (the modal never closes itself).
   */
  readonly open: T | undefined | false;
  /**
   * Children can be either a standard JSX element, or a function that is called with an accessor
   * to the non-nullable value passed to open. This is similar to the function form of the Show component.
   * see Modal doc for example.
   */
  readonly children: ChildrenOrFunc<[Accessor<NonNullable<T>>]>;
  /**
   * Handler called when the user tries to escape from the modal, either by pressing the Escape key,
   * or by clicking outside. If these actions should close the modal, this handler needs to set the
   * open prop to false.
   */
  readonly onEscape?: (reason: EscapeReason) => void;
}

export const MODAL_STYLE_PRESETS = {
  narrow: {width: "420px"},
  medium: {width: "min(700px, 80%)"},
} satisfies Partial<Record<string, JSX.CSSProperties>>;

const ESCAPE_REASONS = ["escapeKey", "clickOutside", "modalCleanup"] as const;

type EscapeReason = (typeof ESCAPE_REASONS)[number];

/**
 * Props of a modal without close reasons specified. It can close itself by any of the escape reasons,
 * but doesn't have a close button.
 */
interface PropsNoCloseReason<T> extends BaseProps<T> {
  closeOn?: undefined;
  onClose?: undefined;
}

/**
 * Props of a modal that specifies some close reasons.
 *
 * If close reasons are specified using closeOn prop, the onClose handler needs to be specified as well,
 * to actually handle the closing.
 */
interface PropsWithCloseReason<T, C extends CloseReason = CloseReason> extends BaseProps<T> {
  /**
   * The list of reasons that cause the modal to close.
   *
   * If `"closeButton"` is specified, the modal has a close button (x in a corner).
   *
   * If the Esc or click outside is specified as a reason, it is still passed to onEscape,
   * but the same reason is also passed to onClose, so either of these two handlers can close
   * the modal.
   *
   * The modal cleanup is always a reason for closing the modal.
   */
  closeOn: C | C[];
  /**
   * Handler called when any of the close reasons (specified in closeOn) occurs. The handler
   * should typically set the open prop to false to actually close the modal.
   */
  onClose: (reason: C | "modalCleanup") => void;
}

type CloseReason = "escapeKey" | "clickOutside" | "closeButton";

function isEscapeReason(reason: EscapeReason | CloseReason): reason is EscapeReason {
  return (ESCAPE_REASONS as readonly (EscapeReason | CloseReason)[]).includes(reason);
}

type Props<T, C extends CloseReason> = PropsNoCloseReason<T> | PropsWithCloseReason<T, C>;

const DRAG_MARGIN = 50;

/**
 * A modal, displaying on top of the page.
 *
 * The modal is opened whenever `props.open` is truthy. The modal never closes itself. The ways of
 * closing the modal are described in the docs for props.
 *
 * The content of the modal can be specified either directly as children, or in the function form,
 * in which case the content has access to the (non-nullable) value of `props.open`. This mechanism
 * is similar to the function form of the `<Show>` component.
 *
 * Example:
 *
 *     declare const value: Accessor<string | undefined>;
 *
 *     <Modal open={value()}>
 *       {(value: Accessor<string>) => (
 *         <>
 *           <div>string: {value()}</div>
 *           <div>length: {value().length}</div>
 *         </>
 *       )}
 *     </Modal>
 */
export const Modal = <T, C extends CloseReason>(props: Props<T, C>): JSX.Element => {
  const t = useLangFunc();
  const resizeObserver = useResizeObserver();
  const closeOn = createMemo(
    () =>
      new Set<CloseReason>(
        props.closeOn ? (typeof props.closeOn === "string" ? [props.closeOn] : props.closeOn) : undefined,
      ),
  );
  function tryClose(reason: EscapeReason | CloseReason) {
    if (props.onEscape && isEscapeReason(reason)) {
      props.onEscape(reason);
    }
    if (reason === "modalCleanup" || closeOn().has(reason)) {
      props.onClose?.(reason as C);
    }
  }
  onCleanup(() => tryClose("modalCleanup"));
  const [state, send] = useMachine(
    dialog.machine({
      closeOnInteractOutside: false,
      closeOnEscapeKeyDown: false,
      onEscapeKeyDown: () => tryClose("escapeKey"),
      onInteractOutside: () => tryClose("clickOutside"),
      onPointerDownOutside: () => tryClose("clickOutside"),
      id: createUniqueId(),
    }),
  );
  const api = createMemo(() => dialog.connect(state, send, normalizeProps));
  /** Position of the modal, relative to its default central position. */
  const [relativePos, setRelativePos] = createSignal<readonly [number, number]>([0, 0]);
  const shouldBeOpen = createMemo(() => !!props.open);
  createRenderEffect(() => {
    if (shouldBeOpen()) {
      api().open();
    } else {
      api().close();
      setRelativePos([0, 0]);
    }
  });
  const [grabPos, setGrabPos] = createSignal<readonly [number, number]>();
  let positioner: HTMLDivElement | undefined;
  const [contentElement, setContentElement] = createSignal<HTMLDivElement>();
  // eslint-disable-next-line solid/reactivity
  const contentSize = resizeObserver.observeClientSize(contentElement);
  const contentPos = (): Size | undefined =>
    contentSize() && [
      (windowSize()[0] - contentSize()![0]) / 2 + relativePos()[0],
      (windowSize()[1] - contentSize()![1]) / 2 + relativePos()[1],
    ];
  createComputed(() => {
    if (!contentSize()) {
      return;
    }
    const [cw] = contentSize()!;
    const [cx, cy] = contentPos()!;
    let dx = 0;
    let dy = 0;
    const overRight = cx + DRAG_MARGIN - windowSize()[0];
    if (overRight > 0) {
      dx = -overRight;
    } else {
      const overLeft = -(cx + cw - DRAG_MARGIN);
      if (overLeft > 0) {
        dx = overLeft;
      }
    }
    if (cy < 0) {
      dy -= cy;
    } else {
      const overBottom = cy + DRAG_MARGIN - windowSize()[1];
      if (overBottom > 0) {
        dy = -overBottom;
      }
    }
    if (dx || dy) {
      setRelativePos([relativePos()[0] + dx, relativePos()[1] + dy]);
    }
  });
  return (
    <Show when={props.open}>
      {(value) => (
        <Show when={api().isOpen}>
          <Portal>
            <div
              class={cx(s.modal, closeOn().has("closeButton") && s.withCloseButton)}
              onPointerMove={(e) => {
                if (e.buttons === 1) {
                  if (grabPos()) {
                    setRelativePos([e.clientX - grabPos()![0], e.clientY - grabPos()![1]]);
                  }
                } else {
                  setGrabPos(undefined);
                }
              }}
              onPointerUp={[setGrabPos, undefined]}
            >
              <div {...api().backdropProps} />
              <div ref={positioner} {...api().positionerProps}>
                <div
                  ref={setContentElement}
                  {...api().contentProps}
                  style={{
                    ...props.style,
                    left: `${relativePos()[0]}px`,
                    top: `${relativePos()[1]}px`,
                  }}
                >
                  <Show when={props.title}>
                    <h2
                      {...api().titleProps}
                      onPointerDown={(e) => {
                        if (e.buttons === 1) {
                          setGrabPos([
                            e.clientX - positioner!.clientLeft - relativePos()[0],
                            e.clientY - positioner!.clientTop - relativePos()[1],
                          ]);
                        }
                      }}
                    >
                      {props.title}
                    </h2>
                  </Show>
                  <div class={s.body}>{getChildrenElement(props.children, value)}</div>
                  {/* Place the close button at the end so that it is focused last. */}
                  <Show when={closeOn().has("closeButton")}>
                    <Button
                      class={s.closeButton}
                      aria-label={t("actions.close")}
                      onClick={() => props.onClose?.("closeButton" as C)}
                    >
                      <VsClose class="w-6 h-6" />
                    </Button>
                  </Show>
                </div>
              </div>
            </div>
          </Portal>
        </Show>
      )}
    </Show>
  );
};
