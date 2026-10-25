import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPkr,
  validateColour,
  calculateOrderTotal,
  generateCandidateSixDigitId,
  formatWhatsAppPhoneNumber,
  buildWhatsAppOrderUrl,
} from './orderLogic.ts';

test('formatPkr formats correctly with currency symbol', () => {
  assert.equal(formatPkr(2500), 'PKR 2,500');
  assert.equal(formatPkr(0), 'PKR 0');
  assert.equal(formatPkr(14999), 'PKR 14,999');
});

test('validateColour matches case-insensitively and rejects invalid colours', () => {
  const colours = ['Emerald Green', 'Royal Maroon', 'Mustard Gold'];
  assert.equal(validateColour('Emerald Green', colours), true);
  assert.equal(validateColour('emerald green', colours), true);
  assert.equal(validateColour('EMERALD GREEN', colours), true);
  assert.equal(validateColour('Sky Blue', colours), false);
  assert.equal(validateColour('', colours), false);
  assert.equal(validateColour('Emerald Green', []), false);
});

test('calculateOrderTotal computes server total price safely', () => {
  assert.equal(calculateOrderTotal(1250, 2), 2500);
  assert.equal(calculateOrderTotal(3500.5, 3), 10501.5);
  assert.throws(() => calculateOrderTotal(-10, 1));
  assert.throws(() => calculateOrderTotal(100, 0));
  assert.throws(() => calculateOrderTotal(100, 2.5));
});

test('generateCandidateSixDigitId always produces a 6-digit string', () => {
  for (let i = 0; i < 50; i++) {
    const id = generateCandidateSixDigitId();
    assert.equal(id.length, 6, `Length must be 6: ${id}`);
    assert.match(id, /^[1-9]\d{5}$/, `Must be 6 digits without leading zero: ${id}`);
  }
});

test('formatWhatsAppPhoneNumber converts 03xxxxxxxxx to 923xxxxxxxxx', () => {
  assert.equal(formatWhatsAppPhoneNumber('03067341386'), '923067341386');
  assert.equal(formatWhatsAppPhoneNumber('923067341386'), '923067341386');
  assert.equal(formatWhatsAppPhoneNumber('+92 306-7341386'), '923067341386');
});

test('buildWhatsAppOrderUrl builds expected wa.me URL with all required fields', () => {
  const payload = {
    orderId: '477383',
    createdAt: '2026-10-25T12:00:00Z',
    customerName: 'Fatima Zahra',
    customerPhone: '03001234567',
    customerCity: 'Lahore',
    deliveryAddress: 'House 14, Street 2, Gulberg III',
    productName: 'Pure Raw Silk Dupatta',
    productId: 'prod-101',
    selectedColour: 'Emerald Green',
    quantity: 2,
    unitPrice: 2800,
    totalPrice: 5600,
    paymentMethod: 'JazzCash',
  };

  const url = buildWhatsAppOrderUrl(payload, '03067341386');
  assert.ok(url.startsWith('https://wa.me/923067341386?text='));
  const decoded = decodeURIComponent(url.split('text=')[1]);
  assert.ok(decoded.includes('NEW ORDER — AL KAREEM MATCHING CENTRE'));
  assert.ok(decoded.includes('Order ID: 477383'));
  assert.ok(decoded.includes('Customer Name: Fatima Zahra'));
  assert.ok(decoded.includes('Colour: Emerald Green'));
  assert.ok(decoded.includes('Quantity: 2'));
  assert.ok(decoded.includes('Total: PKR 5,600'));
  assert.ok(decoded.includes('Payment Status: Awaiting Verification'));
  assert.ok(decoded.includes('Payment Proof: Securely available in the owner dashboard.'));
});
