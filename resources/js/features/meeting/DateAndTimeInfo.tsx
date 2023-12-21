import {EN_DASH} from "components/ui/symbols";
import {cx, useLangFunc} from "components/utils";
import {formatDayMinuteHM} from "components/utils/day_minute_util";
import {DateTime} from "luxon";
import {Show, VoidComponent} from "solid-js";

interface Props {
  readonly date: DateTime;
  readonly startDayMinute: number;
  readonly durationMinutes?: number;
  readonly twoLines?: boolean;
}

export const DateAndTimeInfo: VoidComponent<Props> = (props) => {
  const t = useLangFunc();
  return (
    <div class={cx("flex", props.twoLines ? "flex-col" : "gap-1")}>
      <div>
        {props.date.toLocaleString({
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
      <div class="flex gap-1">
        <span class="font-semibold">{formatDayMinuteHM(props.startDayMinute)}</span>
        <Show when={props.durationMinutes}>
          {(durationMinutes) => (
            <>
              <span>{EN_DASH}</span>
              <span class="font-semibold">{formatDayMinuteHM(props.startDayMinute + durationMinutes())}</span>
              <span>{t("parenthesised", {text: t("calendar.units.minutes", {count: durationMinutes()})})}</span>
            </>
          )}
        </Show>
      </div>
    </div>
  );
};