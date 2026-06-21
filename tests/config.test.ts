import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidConfig } from '../src/core/config.ts';

test('isValidConfig accepts a well-formed config', () => {
  assert.equal(
    isValidConfig({ version: 1, baseDirs: ['C:\\A'], scanDepth: 1, cacheTtlMinutes: 5 }),
    true
  );
});

test('isValidConfig rejects wrong version', () => {
  assert.equal(
    isValidConfig({ version: 2, baseDirs: ['C:\\A'], scanDepth: 1, cacheTtlMinutes: 5 }),
    false
  );
});

test('isValidConfig rejects missing fields', () => {
  assert.equal(isValidConfig({ version: 1, baseDirs: ['C:\\A'] }), false);
});

test('isValidConfig rejects non-string entries in baseDirs', () => {
  assert.equal(
    isValidConfig({ version: 1, baseDirs: [1, 2], scanDepth: 1, cacheTtlMinutes: 5 }),
    false
  );
});

test('isValidConfig rejects non-object input', () => {
  assert.equal(isValidConfig(null), false);
  assert.equal(isValidConfig('config'), false);
});
