import { describe, it, expect } from 'vitest';

import {
  createItemViewUrl,
  createTableViewUrl,
  getOrderFromUrl
} from './url';

describe('url', () => {
  describe('getOrderFromUrl', () => {
    it('should return "asc" if order is "asc"', () => {
      const url = 'https://example.com?order=asc';
      expect(getOrderFromUrl(url)).toBe('asc');
    });
    it('should return "desc" if order is "desc"', () => {
      const url = 'https://example.com?order=desc';
      expect(getOrderFromUrl(url)).toBe('desc');
    });
    it('should return undefined if order is not "asc" or "desc"', () => {
      const url = 'https://example.com?order=invalid';
      expect(getOrderFromUrl(url)).toBeUndefined();
    });
  });
  describe('createItemViewUrl', () => {
    it('should create the item view URL', () => {
      const baseUrl = 'https://example.com';
      const formId = '123';
      const itemId = '456';
      const prev = 'https://example.com';
      expect(createItemViewUrl(baseUrl, {formId, itemId, prev})).toBe(
        'https://example.com/?view=item&formId=123&itemId=456&prev=https%3A%2F%2Fexample.com'
      );
    });
  });
  describe('createTableViewUrl', () => {
    it('should create the table view URL', () => {
      const baseUrl = 'https://example.com';
      const formId = '123';
      const message = 'message';
      const order = 'asc';
      const orderBy = 'name';
      expect(createTableViewUrl(baseUrl, {formId, message, order, orderBy})).toBe(
        'https://example.com/?view=table&formId=123&msg=message&order=asc&orderBy=name'
      );
    });
  });
});
