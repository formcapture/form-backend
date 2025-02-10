import { describe, it, expect } from 'vitest';

import {
  createItemViewUrl,
  createTableViewUrl,
  getOrderFromUrl,
  getPageFromUrl
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
  describe('getPageFromUrl', () => {
    it('should return 0 if page is not set', () => {
      const url = 'https://example.com';
      expect(getPageFromUrl(url)).toBe(0);
    });
    it('should return 0 if page is not a number', () => {
      const url = 'https://example.com?page=invalid';
      expect(getPageFromUrl(url)).toBe(0);
    });
    it('should return 0 if page is less than 1', () => {
      const url = 'https://example.com?page=0';
      expect(getPageFromUrl(url)).toBe(0);
    });
    it('should return the 0-based page number', () => {
      const url = 'https://example.com?page=1';
      expect(getPageFromUrl(url)).toBe(0);
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
      const page = 1;
      const order = 'asc';
      const orderBy = 'name';
      expect(createTableViewUrl(baseUrl, {formId, message, page, order, orderBy})).toBe(
        'https://example.com/?view=table&formId=123&msg=message&page=1&order=asc&orderBy=name'
      );
    });
  });
});
