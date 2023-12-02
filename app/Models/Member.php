<?php

namespace App\Models;

use App\Models\QueryBuilders\MemberBuilder;
use App\Models\Traits\BaseModel;
use App\Models\Traits\HasUuid;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string user_id
 * @property string facility_id
 * @property ?string staff_member_id
 * @property ?string client_id
 * @property ?string facility_admin_grant_id
 * @property-read Timetable $timetable
 * @method static MemberBuilder query()
 */
class Member extends Model
{
    use BaseModel;

    protected $table = 'members';

    protected $fillable = [
        'user_id',
        'facility_id',
        'staff_member_id',
        'client_id',
        'facility_admin_grant_id',
    ];

    protected $casts = self::BASE_CASTS;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function facility(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function staffMember(): BelongsTo
    {
        return $this->belongsTo(Facility::class);
    }
}
