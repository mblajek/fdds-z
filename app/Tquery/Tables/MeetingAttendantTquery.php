<?php

namespace App\Tquery\Tables;

use App\Models\UuidEnum\DictionaryUuidEnum;
use App\Tquery\Config\TqConfig;
use App\Tquery\Config\TqDataTypeEnum;
use App\Tquery\Config\TqDictDef;
use App\Tquery\Config\TqTableAliasEnum;
use App\Tquery\Engine\TqBuilder;

readonly class MeetingAttendantTquery extends MeetingTquery
{
    protected function getBuilder(): TqBuilder
    {
        $builder = parent::getBuilder();
        $builder->join(
            TqTableAliasEnum::meetings,
            TqTableAliasEnum::meeting_attendants,
            'meeting_id',
            left: false,
            inv: true,
        );
        $builder->join(
            TqTableAliasEnum::meeting_attendants,
            TqTableAliasEnum::attendant,
            'user_id',
            left: false,
            inv: false,
        );
        return $builder;
    }

    protected function getConfig(): TqConfig
    {
        $config = parent::getConfig();

        $config->addJoined(
            TqDataTypeEnum::uuid,
            TqTableAliasEnum::meeting_attendants,
            'user_id',
            'attendant.user_id'
        );
        $config->addJoined(
            TqDataTypeEnum::string,
            TqTableAliasEnum::attendant,
            'name',
            'attendant.name'
        );
        $config->addJoined(
            new TqDictDef(TqDataTypeEnum::dict, DictionaryUuidEnum::AttendanceType),
            TqTableAliasEnum::meeting_attendants,
            'attendance_type_dict_id',
            'attendant.attendance_type_dict_id'
        );
        $config->addJoined(
            new TqDictDef(TqDataTypeEnum::dict, DictionaryUuidEnum::AttendanceStatus),
            TqTableAliasEnum::meeting_attendants,
            'attendance_status_dict_id',
            'attendant.attendance_status_dict_id',
        );

        return $config;
    }
}
