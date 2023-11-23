<?php

namespace App\Models;

use App\Exceptions\FatalExceptionFactory;
use App\Models\Enums\AttributeType;
use App\Models\QueryBuilders\ValueBuilder;
use App\Utils\Uuid\UuidTrait;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string attribute_id
 * @property string object_id
 * @property ?string position_id
 * @property ?string ref_object_id
 * @property ?string string_value
 * @property ?int int_value
 * @property ?int datetime_value
 * @property string created_by
 * @property-read Attribute attribute
 * @method static ValueBuilder query()
 */
class Value extends BaseModel
{
    use HasFactory;
    use UuidTrait;

    protected $table = 'values';

    protected $fillable = [
        'attribute_id',
        'object_id',
        'position_id',
        'ref_object_id',
        'string_value',
        'int_value',
        'datetime_value',
        'created_by',
    ];

    protected $casts = [
        'created_at' => 'immutable_datetime',
        'updated_at' => 'immutable_datetime',
        'int_value' => 'integer',
        'datetime_value' => 'immutable_datetime',
    ];

    protected $with = ['attribute'];

    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class, 'attribute_id');
    }

    public function getScalarValue(): string|int|bool|null
    {
        $attributeType = $this->attribute->type;
        $value = $attributeType->tryGetTable() ? $this->ref_object_id : match ($attributeType) {
            AttributeType::Bool, AttributeType::Int => $this->int_value,
            AttributeType::Dict => $this->position_id,
            // todo: date, datetime
            default => FatalExceptionFactory::unexpected()->throw(),
        };
        if ($value === null) {
            // at least one column must contain non-null value
            FatalExceptionFactory::unexpected()->throw();
        }
        return match ($attributeType) {
            AttributeType::Bool => (bool)$value,
            AttributeType::Int => $value,
            // todo: date, datetime
            default => (string)$value,
        };
    }
}
