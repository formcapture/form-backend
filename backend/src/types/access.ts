/**
 * Access control for forms.
 */
export type Access = {
  /**
   * List of roles that can read the form.
   * An empty list signifies that no role can read the form.
   * If set to true, reading is also permitted for non-logged in users.
   */
  read: true | string[];
  /**
   * List of roles that can write the form. Reading is automatically permitted
   * for a role, when writing is permitted.
   * An empty list signifies that no role can write the form.
   * If set to true, writing is also permitted for non-logged in users.
   */
  write: true | string[];
};
