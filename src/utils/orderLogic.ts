/**
 * Pure order calculations, validation, formatting, and WhatsApp handoff logic.
 */

export interface OrderWhatsAppPayload {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  deliveryAddress: string;
  productName: string;
  productId: string;
  selectedColour: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  paymentMethod: string;
}

/**
 * Format a numeric amount into PKR currency string
 */
export function formatPkr(amount: number): string {
  const rounded = Math.round(amount);
  return `PKR ${rounded.toLocaleString('en-PK')}`;
}

/**
 * Validates selected colour exists in the product's available colours
 */
export function validateColour(selectedColour: string, availableColours: string[]): boolean {
  if (!selectedColour || !Array.isArray(availableColours) || availableColours.length === 0) {
    return false;
  }
  const normalized = selectedColour.trim().toLowerCase();
  return availableColours.some((c) => c.trim().toLowerCase() === normalized);
}

/**
 * Calculates order total price on the server.
 * Never trust client calculations.
 */
export function calculateOrderTotal(unitPrice: number, quantity: number): number {
  if (unitPrice < 0 || quantity <= 0 || !Number.isInteger(quantity)) {
    throw new Error('Invalid unit price or quantity');
  }
  return Math.round(unitPrice * quantity * 100) / 100;
}

/**
 * Generates candidate 6-digit numeric ID string between 100000 and 999999
 */
export function generateCandidateSixDigitId(randomVal?: number): string {
  // randomVal for testing or deterministic checks; otherwise Math.random()
  const r = typeof randomVal === 'number' ? randomVal : Math.random();
  const num = Math.floor(100000 + r * 900000);
  return String(num);
}

/**
 * Formats a Pakistani phone number to international wa.me format without leading 0.
 * e.g. "03067341386" -> "923067341386"
 */
export function formatWhatsAppPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('92')) {
    return cleaned;
  }
  if (cleaned.startsWith('03')) {
    return `92${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('3') && cleaned.length === 10) {
    return `92${cleaned}`;
  }
  return cleaned;
}

/**
 * Builds the official WhatsApp Click to Chat URL as specified:
 * https://wa.me/923067341386?text=URL_ENCODED_MESSAGE
 */
export function buildWhatsAppOrderUrl(
  order: OrderWhatsAppPayload,
  recipientPhone: string = '03067341386'
): string {
  const formattedPhone = formatWhatsAppPhoneNumber(recipientPhone);

  const formattedDate = new Date(order.createdAt).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const lines = [
    'NEW ORDER — AL KAREEM MATCHING CENTRE',
    `Order ID: ${order.orderId}`,
    `Order Date: ${formattedDate}`,
    `Customer Name: ${order.customerName}`,
    `Customer Phone: ${order.customerPhone}`,
    `City: ${order.customerCity}`,
    `Delivery Address: ${order.deliveryAddress}`,
    `Product: ${order.productName}`,
    `Product ID: ${order.productId}`,
    `Colour: ${order.selectedColour}`,
    `Quantity: ${order.quantity}`,
    `Unit Price: PKR ${Math.round(order.unitPrice).toLocaleString('en-PK')}`,
    `Total: PKR ${Math.round(order.totalPrice).toLocaleString('en-PK')}`,
    `Payment Method: ${order.paymentMethod}`,
    'Payment Status: Awaiting Verification',
    'Order Status: In Review',
    'Payment Proof: Securely available in the owner dashboard.',
  ];

  const messageText = lines.join('\n');
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;
}
