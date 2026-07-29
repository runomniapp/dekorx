// Phone Number Formatting helper for Turkey (+90)
export function formatPhoneNumber(value) {
  if (!value) return '';
  const phoneNumber = value.replace(/\D/g, '');
  const phoneNumberLength = phoneNumber.length;

  if (phoneNumberLength < 4) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  }
  if (phoneNumberLength < 9) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
  }
  return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 8)}${phoneNumber.slice(8, 10)}`;
}

// Currency Formatter
export function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0
  }).format(amount);
}

// Quote Estimator Formula
export function calculateQuoteEstimate({ roomType, width, length, height, materialQuality, doorType }) {
  const area = (parseFloat(width || 4) * parseFloat(length || 3));
  const baseRateMap = {
    kitchen: 4500,
    wardrobe: 3800,
    living: 5200,
    bathroom: 3200,
    office: 4100
  };

  const materialMultiplierMap = {
    standard: 1.0,
    premium: 1.35,
    luxury: 1.75
  };

  const doorMultiplierMap = {
    matte: 1.0,
    glossy: 1.15,
    wood: 1.25,
    glass: 1.4
  };

  const baseRate = baseRateMap[roomType] || 4000;
  const materialMultiplier = materialMultiplierMap[materialQuality] || 1.0;
  const doorMultiplier = doorMultiplierMap[doorType] || 1.0;

  const total = Math.round(area * baseRate * materialMultiplier * doorMultiplier);
  const minEstimate = Math.round(total * 0.9);
  const maxEstimate = Math.round(total * 1.1);

  return {
    total,
    minEstimate,
    maxEstimate,
    formatted: `${formatCurrency(minEstimate)} - ${formatCurrency(maxEstimate)}`
  };
}
