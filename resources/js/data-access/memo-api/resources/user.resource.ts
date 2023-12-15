/**
 * @see `/app/Http/Resources/UserResource.php`
 */
export interface UserResource {
  /**
   * identifier
   * @type {string(uuid)}
   * @example '67da972b-34d7-4f89-b8ae-322d96b4954d'
   */
  readonly id: string;
  /**
   * full name
   * @type {string}
   */
  readonly name: string;
  /**
   * email address
   * @type {string(email)}
   * @example 'test@test.pl'
   */
  readonly email: string;
  /**
   * facility identifier where the user was last logged in
   * @type {string(uuid)}
   * @example '67da972b-34d7-4f89-b8ae-322d96b4954d'
   */
  readonly lastLoginFacilityId: string | null;
  /**
   * password expiration date
   * @type {string(date-time)}
   * @example '2023-05-10T20:46:43Z'
   */
  readonly passwordExpireAt: string;
}
