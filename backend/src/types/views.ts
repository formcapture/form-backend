/** View control for forms. */
export interface Views {
  /**
   * En-/disable the table view. True, if the table view
   * should not be accessible for this form. False, otherwise.
   */
  table: boolean;
  /**
   * En-/disable the item view. True, if the item view
   * should not be accessible for this form. False, otherwise.
   */
  item: boolean;
  /**
   * The number of items per page in the table view.
   * Defaults to 10.
   */
  pageSize?: number;
}
