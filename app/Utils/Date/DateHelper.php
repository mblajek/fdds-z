<?php

namespace App\Utils\Date;

use DateTimeImmutable;
use DateTimeInterface;
use DateTimeZone;

class DateHelper
{
    private const DB_FORMAT = 'Y-m-d H:i:s';
    private const API_FORMAT = 'Y-m-d\\TH:i:sp';
    private static DateTimeZone $utc;

    public static function dbToZuluString(string $date): string
    {
        if (!isset(self::$utc)) {
            self::$utc = new DateTimeZone('UTC');
        }
        return self::toZuluString(DateTimeImmutable::createFromFormat(self::DB_FORMAT, $date, self::$utc));
    }

    public static function zuluToDbString(string $date): string
    {
        return self::toDbString(DateTimeImmutable::createFromFormat(self::API_FORMAT, $date));
    }

    public static function toZuluString(DateTimeInterface $date): string
    {
        if ($date->getOffset() === 0) {
            return $date->format(self::API_FORMAT);
        }
        throw TimezoneException::fromTimezone($date->getTimezone());
    }


    public static function toDbString(DateTimeInterface $date): string
    {
        if ($date->getOffset() === 0) {
            return $date->format(self::DB_FORMAT);
        }
        throw TimezoneException::fromTimezone($date->getTimezone());
    }
}
