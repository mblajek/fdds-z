import { MemberResource } from "./member.resource";

/**
 * @see `/app/Http/Resources/Admin/AdminUserResource.php`
 */
export type AdminUserResource = {
  /**
   * admin user identifier
   * @type {string(uuid)}
   * @example '67da972b-34d7-4f89-b8ae-322d96b4954d'
   */
  id: string;
  /**
   * admin user full name
   * @type {string}
   */
  name: string;
  /**
   * email address
   * @type {string}
   * @example 'test@test.pl'
   */
  email: string | null;
  /**
   * facility identifier where the user was last logged in
   * @type {string(uuid)}
   * @example '67da972b-34d7-4f89-b8ae-322d96b4954d'
   */
  lastLoginFacilityId: string;
  passwordExpireAt: string;
  hasPassword: boolean;
  createdAt: string;
  updatedAt: string;
  hasEmailVerified: boolean;
  /**
   * identifier of a user who created this user
   * @type {string(uuid)}
   * @example '67da972b-34d7-4f89-b8ae-322d96b4954d'
   */
  createdBy: string;
  hasGlobalAdmin: boolean;
  /**
   * array of members
   * @type {MemberResource[]}
   */
  members: MemberResource[];
};