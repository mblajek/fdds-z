<?php

namespace App\Models;

use App\Models\QueryBuilders\MeetingBuilder;
use App\Models\Traits\BaseModel;
use App\Models\Traits\HasCreatedBy;
use App\Models\Traits\HasValidator;
use App\Models\UuidEnum\DictionaryUuidEnum;
use App\Rules\Valid;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Validation\Rule;

/**
 * @property string facility_id
 * @property string category_dict_id
 * @property string type_dict_id
 * @property string notes
 * @property string date
 * @property int start_dayminute
 * @property int duration_minutes
 * @property string status_dict_id
 * @property-read Collection|MeetingAttendant[] $attendants
 * @property-read Collection|MeetingResource[] $resources
 * @method static MeetingBuilder query()
 */
class Meeting extends Model
{
    use HasValidator;
    use BaseModel;
    use HasCreatedBy;

    protected $table = 'meetings';

    protected $fillable = [
        'facility_id',
        'category_dict_id',
        'type_dict_id',
        'date',
        'notes',
        'start_dayminute',
        'duration_minutes',
        'status_dict_id',
        'is_remote',
    ];

    protected $casts = [
        'is_remote' => 'boolean',
        'created_at' => 'immutable_datetime',
        'updated_at' => 'immutable_datetime',
    ];

    protected static function fieldValidator(string $field): string|array
    {
        return match ($field) {
            'facility_id' => Valid::uuid([Rule::exists('facilities')]),
            'type_dict_id' => Valid::dict(DictionaryUuidEnum::meetingType),
            'date' => Valid::date(),
            'notes' => Valid::trimmed(sometimes: true, nullable: true, max: 4000),
            'start_dayminute' => Valid::int(['min:' . (4 * 60), 'max:' . (24 * 60)]),
            'duration_minutes' => Valid::int(['min:' . (5), 'max:' . (24 * 60)]),
            'status_dict_id' => Valid::dict(DictionaryUuidEnum::meetingStatus),
            'is_remote' => Valid::bool(),
            'attendants', 'resources' => Valid::list(sometimes: true, min: 0),
            'attendants.*' => Valid::array(keys: ['user_id', 'attendance_type', 'attendance_status_dict_id']),
            'attendants.*.user_id' => MeetingAttendant::fieldValidator('user_id'),
            'attendants.*.attendance_type' => MeetingAttendant::fieldValidator('attendance_type'),
            'attendants.*.attendance_status_dict_id' => MeetingAttendant::fieldValidator('attendance_status_dict_id'),
            'resources.*' => Valid::array(keys: ['resource_dict_id']),
            'resources.*.resource_dict_id' => MeetingResource::fieldValidator('resource_dict_id'),
        };
    }

    public function attendants(): HasMany
    {
        return $this->hasMany(MeetingAttendant::class);
    }

    public function resources(): HasMany
    {
        return $this->hasMany(MeetingResource::class);
    }
}
