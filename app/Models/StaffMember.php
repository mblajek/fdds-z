<?php

namespace App\Models;

use App\Models\QueryBuilders\StaffMemberBuilder;
use App\Models\Traits\BaseModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property string $timetable_id
 * @property string $deactivated_at
 * @property-read Timetable $timetable
 * @property-read Member $member
 * @method static StaffMemberBuilder query()
 */
class StaffMember extends Model
{
    use BaseModel;

    protected $table = 'staff_members';

    protected $fillable = [
        'timetable_id',
        'deactivated_at',
    ];

    protected $casts = [
        'created_at' => 'immutable_datetime',
        'updated_at' => 'immutable_datetime',
        'deactivated_at' => 'immutable_datetime',
    ];

    public function isActive(): bool
    {
        return ($this->deactivated_at === null);
    }

    public function timetable(): BelongsTo
    {
        return $this->belongsTo(Timetable::class);
    }

    public function member(): HasOne
    {
        return $this->hasOne(Member::class);
    }
}
