<?php

namespace App\Rules;

use Closure;

use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Validator as ValidatorFacade;

/**
 * Rule generator
 * default:
 * - value is present and is of specified type
 * sometimes:
 * - if value doesn't appear in data, other validations (also nullable) are skipped
 * nullable:
 * - if value is null, other validations are skipped, [] and " " are not null in opposite to Laravel validation
 */
class Valid extends AbstractDataRule
{
    public static function bool(array $rules = [], bool $sometimes = false, bool $nullable = false): array
    {
        return self::base($sometimes, $nullable, ['boolean', DataTypeRule::bool()], $rules);
    }

    public static function int(array $rules = [], bool $sometimes = false, bool $nullable = false): array
    {
        return self::base($sometimes, $nullable, ['numeric', 'integer', DataTypeRule::int()], $rules);
    }

    public static function string(
        array $rules = [],
        bool $sometimes = false,
        bool $nullable = false,
        int $max = 250,
    ): array {
        return self::base($sometimes, $nullable, ['string', 'min:1', "max:$max"], $rules);
    }

    public static function trimmed(
        array $rules = [],
        bool $sometimes = false,
        bool $nullable = false,
        int $max = 250,
    ): array {
        return self::base($sometimes, $nullable, ['string', 'min:1', "max:$max", new StringIsTrimmedRule()], $rules);
    }

    public static function uuid(
        array $rules = [],
        bool $sometimes = false,
        bool $nullable = false,
    ): array {
        return self::base($sometimes, $nullable, ['string', 'lowercase', 'uuid'], $rules);
    }

    public static function array(
        array $rules = [],
        bool $sometimes = false,
        bool $nullable = false,
        array $keys = [],
    ): array {
        return self::base($sometimes, $nullable, ['array' . (count($keys) ? (':' . implode(',', $keys)) : '')], $rules);
    }

    public static function list(
        array $rules = [],
        bool $sometimes = false,
        bool $nullable = false,
        int $min = 1,
    ): array {
        return self::base($sometimes, $nullable, ['array', "min:$min", new ArrayIsListRule()], $rules);
    }


    private function __construct(
        private readonly bool $nullable,
        private readonly array $rules,
    ) {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null) {
            if (!$this->nullable) {
                $this->validator->addFailure($attribute, 'required');
            }
            return;
        }

        try {
            ValidatorFacade::validate(['value' => $value], ['value' => $this->rules]);
        } /** @noinspection PhpRedundantCatchClauseInspection */
        catch (ValidationException $validationException) {
            foreach ($validationException->validator->failed() as $fieldErrors) {
                foreach ($fieldErrors as $rule => $interpolationData) {
                    $this->validator->addRules([$attribute => $this->rules]);
                    $this->validator->addFailure($attribute, Str::snake($rule), $interpolationData);
                }
            }
        }
    }

    private static function base(bool $sometimes, bool $nullable, array $rules, array $additionalRules): array
    {
        return array_merge(
            $sometimes ? ['sometimes'] : [],
            ['present', new self($nullable, array_merge(['bail'], $rules, $additionalRules))],
        );
    }
}