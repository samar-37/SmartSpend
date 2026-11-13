export function parseAmountToMinor(value) {
  const normalized = String(value).trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    const error = new Error('Amount must be a positive number with up to 2 decimal places');
    error.statusCode = 400;
    throw error;
  }
  const [whole, fraction = ''] = normalized.split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor < 1) {
    const error = new Error('Amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }
  return minor;
}

export function formatMinorAmount(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}
