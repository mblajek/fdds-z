<?php

namespace App\Tquery\Engine;

use App\Exceptions\FatalExceptionFactory;
use App\Tquery\Request\TqRequest;
use App\Tquery\Request\TqRequestColumn;
use Closure;
use Illuminate\Support\Facades\App;
use stdClass;
use Throwable;

readonly class TqEngine
{
    // readonly, but mutable
    private TqBuilder $builder;

    public function __construct(
        Closure $getBuilder,
        private TqRequest $request,
    ) {
        $this->builder = $getBuilder();
    }

    public function run(): array
    {
        $this->applyJoin();
        $this->applySelect();
        $this->applyFilter();
        $this->applySort();
        $this->applyPaging();
        $sql = $this->builder->getSql(true);
        $debug = (App::hasDebugModeEnabled() ? ['sql' => $sql] : []);

        try {
            return array_merge($debug, ['meta' => $this->getMeta(), 'data' => $this->getData()]);
        } catch (Throwable) {
            throw FatalExceptionFactory::tquery($debug);
        }
    }

    private function applyJoin(): void
    {
        foreach ($this->request->allColumns as $columnConfig) {
            $columnConfig->applyJoin($this->builder);
        }
    }

    private function applySelect(): void
    {
        foreach ($this->request->selectColumns as $requestColumn) {
            $requestColumn->applySelect($this->builder);
        }
    }

    private function applyFilter(): void
    {
        match ($this->request->filter) {
            true => null,
            false => $this->builder->where(fn(null $bind) => 'false', false, null, false, false),
            default => $this->request->filter->applyFilter($this->builder, false, false)
        };
    }

    private function applySort(): void
    {
        foreach ($this->request->sortColumns as $requestSort) {
            $requestSort->applySort($this->builder);
        }
    }

    private function applyPaging(): void
    {
        $this->builder->applyPaging($this->request->number, $this->request->size);
    }

    private function getData(): array
    {
        return $this->builder->getData()->map(function (stdClass $row) {
            $array = [];
            foreach ($this->request->selectColumns as $requestColumn) {
                $columnAlias = $requestColumn->column->columnAlias;
                $array[$columnAlias] = $requestColumn->column->render($row->{$columnAlias});
            }
            return $array;
        })->toArray();
    }


    private function getMeta(): array
    {
        return [
            'columns' => array_map(fn(TqRequestColumn $requestColumn) => [
                'type' => $requestColumn->type->name,
                'column' => $requestColumn->column->columnAlias,
            ], $this->request->selectColumns),
            'totalDataSize' => $this->builder->getCount(),
        ];
    }
}