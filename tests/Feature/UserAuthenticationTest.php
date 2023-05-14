<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class UserAuthenticationTest extends TestCase
{
    private const URL_STATUS = '/api/v1/user/status';
    private const URL_LOGIN = '/api/v1/user/login';
    private const URL_LOGOUT = '/api/v1/user/logout';

    use DatabaseTransactions;

    public function testStatusWithUnauthorizedUserWillFail(): void
    {
        $result = $this->get(static::URL_STATUS);

        $this->assertEquals('exception.unauthorised', $result->json('errors')[0]['code']);
        $result->assertUnauthorized();
        $result->assertJsonStructure($this->unauthorizedErrorJsonStructure());
    }

    public function testStatusWithAuthorizedUserWillPass(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        Auth::setUser($user);

        $result = $this->get(static::URL_STATUS);

        $this->assertEquals($user->id, $result->json('data.user.id'));
        $result->assertOk();
        $result->assertJsonStructure($this->loggedUserStatusJsonStructure());
    }

    public function testLoginWithInvalidDataWillFail(): void
    {
        $data = [
            'email' => 'test',
            'password' => [5],
        ];

        $result = $this->post(static::URL_LOGIN, $data);

        $this->assertEquals('exception.validation', $result->json('errors')[0]['code']);
        $result->assertBadRequest();
        $result->assertJsonStructure($this->invalidLoginErrorJsonStructure());
    }

    public function testLoginWithNonexistentDataWillFail(): void
    {
        $data = [
            'email' => 'test@test.pl',
            'password' => '12345',
        ];

        $result = $this->post(static::URL_LOGIN, $data);

        $this->assertEquals('exception.unauthorised', $result->json('errors')[0]['code']);
        $result->assertUnauthorized();
        $result->assertJsonStructure($this->unauthorizedErrorJsonStructure());
    }

    public function testLoginWithExistentDataWillPass(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $data = [
            'email' => $user->email,
            'password' => 'password',
        ];

        $result = $this->post(static::URL_LOGIN, $data);

        $this->assertEquals($user->id, Auth::user()->id);
        $result->assertOk();
    }

    public function testLogoutWillPass(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        Auth::setUser($user);

        $result = $this->post(static::URL_LOGOUT);

        $this->assertEquals(null, Auth::user());
        $result->assertOk();
    }

    private function unauthorizedErrorJsonStructure(): array
    {
        return [
            'errors' => [
                [
                    'code',
                ],
            ],
        ];
    }

    private function invalidLoginErrorJsonStructure(): array
    {
        return [
            'errors' => [
                [
                    'code',
                    'validation' => [
                        [
                            'field',
                            'code',
                        ]
                    ],
                ],
            ],
        ];
    }

    private function loggedUserStatusJsonStructure(): array
    {
        return [
            'data' => [
                'user' => [
                    'id',
                    'name',
                    'email',
                    'isEmailVerified',
                    'lastLoginFacilityId',
                ],
            ],
        ];
    }
}
