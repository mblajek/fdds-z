import {createTableTranslations} from "components/ui/Table";
import {TQueryTable} from "components/ui/Table/TQueryTable";
import {FacilityMeeting} from "data-access/memo-api/groups/FacilityMeeting";
import {useTableColumns} from "data-access/memo-api/tquery/table_columns";
import {useMeetingTableColumns, useMeetingTableFilters} from "features/meeting/meeting_tables";
import {VoidComponent} from "solid-js";
import {activeFacilityId} from "state/activeFacilityId.state";

export default (() => {
  const cols = useMeetingTableColumns();
  const meetingTableFilters = useMeetingTableFilters();
  const {getCreatedUpdatedColumns} = useTableColumns();
  return (
    <TQueryTable
      mode="standalone"
      staticPrefixQueryKey={FacilityMeeting.keys.meeting()}
      staticEntityURL={`facility/${activeFacilityId()}/meeting/attendant`}
      staticTranslations={createTableTranslations(["meeting_multi_attendant", "meeting_attendant", "meeting"])}
      staticPersistenceKey="facilityMeetingAttendants"
      // This table has multiple heavy to render columns.
      nonBlocking
      columns={[
        cols.attendant.attendanceType,
        cols.attendant.attendant,
        cols.attendant.attendanceStatus,
        cols.meeting.id,
        cols.meeting.date,
        cols.meeting.time,
        cols.meeting.duration,
        cols.meeting.seriesInfo,
        cols.meeting.seriesType,
        cols.meeting.seriesNumber,
        cols.meeting.seriesCount,
        cols.meeting.category,
        cols.meeting.type,
        cols.meeting.statusTags,
        cols.meeting.isFacilityWide,
        cols.meeting.get("attendants", {initialVisible: false}),
        cols.meeting.attendantsAttendance,
        cols.meeting.attendantsCount,
        cols.meeting.staff,
        cols.meeting.staffAttendance,
        cols.meeting.staffCount,
        cols.meeting.clients,
        cols.meeting.clientsAttendance,
        cols.meeting.clientsCount,
        cols.meeting.isRemote,
        cols.meeting.notes,
        cols.meeting.resources,
        ...getCreatedUpdatedColumns({overrides: {columnGroups: "meeting_multicolumn"}}),
        cols.meeting.actions,
      ]}
      intrinsicFilter={meetingTableFilters.isRegularMeeting()}
      intrinsicSort={[
        {type: "column", column: "date", desc: true},
        {type: "column", column: "startDayminute", desc: true},
      ]}
      initialSort={[{id: "date", desc: true}]}
      helpHref="/help/reports#meeting-attendants"
    />
  );
}) satisfies VoidComponent;
