<?php

namespace App\Http\Resources;

use App\Models\Facility;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'FacilityResource',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid', example: 'UUID'),
        new OA\Property(property: 'name', type: 'string', example: 'Test'),
        new OA\Property(property: 'url', type: 'string', example: 'test'),
    ]
)] /**
 * @method __construct(Facility $resource)
 * @mixin Facility
 */
class FacilityResource extends JsonResource
{
    use ResourceTrait;

    protected static function getMappedFields(): array
    {
        return ['id', 'name', 'url'];
    }
}
