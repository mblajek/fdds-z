<?php

namespace App\Services\User;

use App\Models\Grant;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Throwable;

readonly class CreateUserService
{
    /**
     * @throws Throwable
     */
    public function handle(array $data): string
    {
        return DB::transaction(fn() => $this->create($data));
    }

    /**
     * @throws Throwable
     */
    private function create(array $data): string
    {
        $user = new User();

        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->email_verified_at = $data['has_email_verified'] === true ? CarbonImmutable::now() : null;
        $user->password = $data['password'] !== null ? Hash::make($data['password']) : null;
        $user->password_expire_at = $data['password_expire_at'];
        $user->created_by = Auth::user()->id;
        $user->global_admin_grant_id = $data['has_global_admin'] ? Grant::createForUser()->id : null;

        $user->save();

        return $user->id;
    }
}
