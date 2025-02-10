import { checkFilterParams } from './filter';

describe('Filter', () => {
  describe('checkFilterParams', () => {
    it('returns true if all parameters are defined', () => {
      expect(checkFilterParams('key', 'op', 'value')).toBe(true);
    });
    it('returns true if all parameters are undefined', () => {
      expect(checkFilterParams()).toBe(true);
    });
    it('returns false if some parameters are defined and some are undefined', () => {
      expect(checkFilterParams('key', 'op')).toBe(false);
    });
  });
});
