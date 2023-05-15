<?php

namespace App\Http\Controllers;

use App\Http\Permissions\Permission;
use App\Http\Resources\FacilityResource;
use App\Models\Facility;
use App\Services\System\TranslationsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use OpenApi\Attributes as OA;

/** System endpoints without authorisation */
class SystemController extends ApiController
{
    protected function initPermissions(): void
    {
        $this->permissionOneOf(Permission::any);
    }

    #[OA\Get(
        path: '/api/v1/system/translation/{lang}/list',
        summary: 'All translations',
        tags: ['System'],
        parameters: [
            new OA\Parameter(
                name: 'lang', in: 'path', required: true, schema: new OA\Schema(schema: 'string'), example: 'pl-pl'
            )
        ],
        responses: [
            new OA\Response(response: 200, description: 'Translations JSON')
        ]
    )]
    public function translationList(string $locale, TranslationsService $service): JsonResponse
    {
        return new JsonResponse($service->translationList($locale));
    }

    #[OA\Get(
        path: '/api/v1/system/facility/list',
        summary: 'All facilities',
        tags: ['System'],
        responses: [
            new OA\Response(
                response: 200, description: 'All facilities', content: new  OA\JsonContent(properties: [
                new OA\Property(
                    property: 'data', ref: '#/components/schemas/FacilityResource', type: 'array', items: new OA\Items(
                    ref: '#/components/schemas/FacilityResource'
                )
                )
            ])
            )
        ]
    )]
    public function facilityList(): JsonResource
    {
        return FacilityResource::collection(Facility::query()->get());
    }
}
