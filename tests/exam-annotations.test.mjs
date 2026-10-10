import test from 'node:test';
import assert from 'node:assert/strict';
import { annotationId } from '../src/components/content/exam-annotations.mjs';
test('annotation IDs work on HTTP where randomUUID is unavailable', () => {
 const descriptor = Object.getOwnPropertyDescriptor(Crypto.prototype, 'randomUUID');
 try {
  Object.defineProperty(Crypto.prototype, 'randomUUID', { value: undefined, configurable: true });
  const first = annotationId(), second = annotationId();
  assert.match(first, /^[a-f0-9]{32}$/);
  assert.notEqual(first, second);
 } finally { Object.defineProperty(Crypto.prototype, 'randomUUID', descriptor); }
});
