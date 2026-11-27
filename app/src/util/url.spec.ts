import { describe, it, expect } from 'vitest';

import {
  createItemViewUrl,
  createTableViewUrl,
  getFilterFromUrl,
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
    it('should add the filter params', () => {
      expect(createTableViewUrl('https://example.com?foo=bar', {
        formId: '123',
        filterKey: 'name',
        filterOp: 'contains',
        filterValue: 'abc'
      })).toBe('https://example.com/?view=table&formId=123&filterKey=name&filterOp=contains&filterValue=abc');
    });
  });
  describe('createItemViewUrl with message', () => {
    it('should add the message', () => {
      expect(createItemViewUrl('https://example.com', {formId: '123', message: 'saved'})).toBe(
        'https://example.com/?view=item&formId=123&msg=saved'
      );
    });
  });
  describe('getFilterFromUrl', () => {
    it('should return the filter params', () => {
      expect(getFilterFromUrl('https://example.com?filterKey=name&filterOp=contains&filterValue=abc')).toEqual({
        filterKey: 'name',
        filterOp: 'contains',
        filterValue: 'abc'
      });
    });
    it('should drop invalid filter operators', () => {
      expect(getFilterFromUrl('https://example.com?filterOp=foo').filterOp).toBeUndefined();
    });
  });
});
