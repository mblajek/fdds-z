import {FormConfigWithoutTransformFn} from "@felte/core";
import {FelteForm, useFormContext} from "components/felte-form/FelteForm";
import {FelteSubmit} from "components/felte-form/FelteSubmit";
import {useHolidays} from "components/ui/calendar/holidays";
import {WeekDaysCalculator} from "components/ui/calendar/week_days_calculator";
import {CheckboxField} from "components/ui/form/CheckboxField";
import {FieldBox} from "components/ui/form/FieldBox";
import {RangeField} from "components/ui/form/RangeField";
import {SegmentedControl} from "components/ui/form/SegmentedControl";
import {DATE_FORMAT, cx, useLangFunc} from "components/utils";
import {useLocale} from "components/utils/LocaleContext";
import {FormattedDateTime} from "components/utils/date_formatting";
import {FacilityMeeting} from "data-access/memo-api/groups/FacilityMeeting";
import {DateTime} from "luxon";
import {For, VoidComponent, createComputed, createMemo, createSignal, on, onMount, splitProps} from "solid-js";
import {z} from "zod";
import s from "./MeetingSeriesForm.module.scss";

export const getMeetingSeriesSchema = () =>
  z.object({
    // The real type is FacilityMeeting.CloneInterval.
    seriesInterval: z.string(),
    // Float between 0 and 1, scaled non-linearly to the number of meetings, so that the slider is more accurate
    // closer to the start of the range.
    seriesLength: z.number(),
    seriesIncludeDate: z.record(z.boolean()),
  });

export type MeetingSeriesFormType = z.infer<ReturnType<typeof getMeetingSeriesSchema>>;

interface Props extends FormConfigWithoutTransformFn<MeetingSeriesFormType> {
  readonly id: string;
  readonly startDate: DateTime;
  readonly onCancel?: () => void;
}

const INTERVALS: FacilityMeeting.CloneInterval[] = ["1d", "7d", "14d"];

const MAX_NUM_MEETINGS = 100;

export const MeetingSeriesForm: VoidComponent<Props> = (allProps) => {
  const [props, formProps] = splitProps(allProps, ["locale", "id", "startDate", "onCancel"]);
  return (
    <FelteForm
      id={props.id}
      translationsFormNames={["meeting_series_create", "meeting_series"]}
      schema={getMeetingSeriesSchema()}
      {...formProps}
    >
      {(form) => (
        <div class="flex flex-col gap-2">
          <MeetingSeriesControls startDate={props.startDate} />
          <FelteSubmit cancel={props.onCancel} disabled={!!form.warnings("seriesLength")} />
        </div>
      )}
    </FelteForm>
  );
};

interface MeetingSeriseControlsProps {
  readonly startDate: DateTime;
  readonly compact?: boolean;
}

export const MeetingSeriesControls: VoidComponent<MeetingSeriseControlsProps> = (props) => {
  const t = useLangFunc();
  const {form} = useFormContext<MeetingSeriesFormType>();
  const locale = useLocale();
  const weekDaysCalculator = new WeekDaysCalculator(locale);
  const holidays = useHolidays();
  const startDate = createMemo(() => props.startDate.startOf("day"));
  const [meetingDatesTable, setMeetingDatesTable] = createSignal<HTMLDivElement>();
  // Keep meeting dates scrolled to bottom if it was already scrolled to bottom.
  createComputed(
    on(meetingDatesTable, (table) => {
      if (table) {
        setTimeout(() => {
          table.scrollTop = table.scrollHeight;
        });
      }
    }),
  );
  createComputed(
    on(
      () => form.data(),
      () => {
        const table = meetingDatesTable();
        if (!table) {
          return;
        }
        if (table.scrollTop >= table.scrollHeight - table.clientHeight) {
          setTimeout(() => {
            table.scrollTop = table.scrollHeight;
          });
        }
      },
    ),
  );
  const meetingSeriesCloneParams = createMemo(() =>
    getMeetingSeriesCloneParams({startDate: startDate(), values: form.data()}),
  );
  createComputed(() =>
    form.setWarnings(
      "seriesLength",
      meetingSeriesCloneParams().dates.length ? null : [t("meetings.only_one_meeting_in_series_warning")],
    ),
  );

  const MeetingDate: VoidComponent<{date: DateTime; class?: string}> = (props) => (
    <span
      class={cx(
        weekDaysCalculator.isWeekend(props.date) || holidays.isHoliday(props.date) ? "text-red-800" : "text-black",
        props.class,
      )}
    >
      <FormattedDateTime dateTime={props.date} format={{...DATE_FORMAT, weekday: "short"}} alignWeekday />
    </span>
  );

  return (
    <div class="flex flex-col gap-2">
      <div class={props.compact ? "self-start" : undefined}>
        <SegmentedControl
          name="seriesInterval"
          items={Array.from(INTERVALS, (interval) => ({
            value: interval,
            label: () => t(`meetings.interval_labels.${interval}`),
          }))}
          small={props.compact}
        />
      </div>
      <RangeField name="seriesLength" min="0" max="1" step="any" />
      <FieldBox name="seriesMeetingDates" umbrella>
        <div
          ref={setMeetingDatesTable}
          class={cx("self-start pr-1 flex flex-col overflow-y-auto", props.compact ? "h-24" : "h-72")}
        >
          <span>
            <MeetingDate date={startDate()} class="px-1" />{" "}
            <span class="text-sm">{t("parenthesised", {text: t("meetings.first_meeting")})}</span>
          </span>
          <For
            each={
              getMeetingSeriesCloneParams({
                startDate: startDate(),
                values: form.data(),
                includeAllDates: true,
              }).dates
            }
          >
            {(dateISO) => {
              const date = DateTime.fromISO(dateISO);
              if (form.data("seriesIncludeDate")[dateISO] == undefined) {
                onMount(() =>
                  form.setFields(
                    `seriesIncludeDate.${dateISO}`,
                    date.hasSame(startDate(), "day")
                      ? true
                      : // By default skip weekends (unless the start date is on a weekend) and holidays.
                        !holidays.isHoliday(date) &&
                          (!weekDaysCalculator.isWeekend(date) || weekDaysCalculator.isWeekend(startDate())),
                  ),
                );
              }
              return (
                <label class="flex items-baseline gap-2 select-none px-1 hover:bg-hover">
                  <MeetingDate
                    date={date}
                    class={cx({[s.meetingDateSkip!]: !form.data("seriesIncludeDate")[dateISO]})}
                  />
                  <CheckboxField name={`seriesIncludeDate.${dateISO}`} label="" data-felte-keep-on-remove />
                </label>
              );
            }}
          </For>
        </div>
      </FieldBox>
      <div>
        {t("forms.meeting_series.total_number_of_meetings", {
          count: meetingSeriesCloneParams().dates.length + 1,
        })}
      </div>
    </div>
  );
};

const SERIES_LENGTH_EXP = 2;

export function numMeetingsToSeriesLength(numMeetings: number) {
  return ((numMeetings - 2) / (MAX_NUM_MEETINGS - 2)) ** (1 / SERIES_LENGTH_EXP);
}

function seriesLengthToNumMeetings(seriesLength: number) {
  return 2 + Math.ceil((MAX_NUM_MEETINGS - 2) * seriesLength ** SERIES_LENGTH_EXP - 0.1);
}

export function getMeetingSeriesCloneParams({
  startDate,
  values,
  includeAllDates = false,
}: {
  startDate: DateTime;
  values: MeetingSeriesFormType;
  includeAllDates?: boolean;
}): FacilityMeeting.CloneRequest {
  const interval = values.seriesInterval as FacilityMeeting.CloneInterval;
  const daysInterval =
    interval === "1d" ? 1 : interval === "7d" ? 7 : interval === "14d" ? 14 : (interval satisfies never);
  const allDates = Array.from({length: seriesLengthToNumMeetings(values.seriesLength) - 1}, (_, i) =>
    startDate.plus({days: daysInterval * (i + 1)}).toISODate(),
  );
  return {
    interval,
    dates: includeAllDates ? allDates : allDates.filter((date) => values.seriesIncludeDate[date]),
  };
}
