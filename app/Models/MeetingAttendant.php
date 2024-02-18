<?php

namespace App\Models;

use App\Models\Enums\AttendanceType;
use App\Models\QueryBuilders\MeetingAttendantBuilder;
use App\Models\Traits\BaseModel;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string meeting_id
 * @property string user_id
 * @property AttendanceType attendance_type
 * @property string attendance_status_dict_id
 * @method static MeetingAttendantBuilder query()
 */
class MeetingAttendant extends Model
{
    use BaseModel;

    public const ATTENDANCE_STATUS_OK = '1adb737f-da0f-4473-ab9c-55fc1634b397';
    public const ATTENDANCE_STATUS_LATE_PRESENT = '1ce7a7ac-3562-4dff-bd4b-5eee8eb8f90b';

    protected $table = 'meeting_attendants';

    protected $fillable = [
        'meeting_id',
        'user_id',
        'attendance_type',
        'attendance_status_dict_id',
    ];

    protected $casts = [
        'attendance_type' => AttendanceType::class,
        'created_at' => 'immutable_datetime',
        'updated_at' => 'immutable_datetime',
    ];
}
