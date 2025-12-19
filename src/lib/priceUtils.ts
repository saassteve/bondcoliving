import type { Apartment } from './services/types';

export interface PriceDisplay {
  amount: number;
  period: 'night' | 'month';
  formatted: string;
  subtitle?: string;
}

export function getApartmentPrice(apartment: Apartment): PriceDisplay {
  const isShortTerm = apartment.accommodation_type === 'short_term';

  if (isShortTerm) {
    const nightlyPrice = apartment.nightly_price || 0;
    const minNights = apartment.minimum_stay_nights || 2;

    return {
      amount: nightlyPrice,
      period: 'night',
      formatted: `€${nightlyPrice}`,
      subtitle: `Minimum ${minNights} night${minNights > 1 ? 's' : ''}`
    };
  } else {
    const monthlyPrice = apartment.price || 0;
    const minMonths = apartment.minimum_stay_months || 1;

    return {
      amount: monthlyPrice,
      period: 'month',
      formatted: `€${monthlyPrice}`,
      subtitle: minMonths > 1 ? `Minimum ${minMonths} months` : 'Flexible monthly contracts'
    };
  }
}

export function formatPrice(amount: number, period: 'night' | 'month'): string {
  return `€${amount} per ${period}`;
}

export function getAccommodationTypeLabel(type?: 'short_term' | 'long_term'): string {
  if (type === 'short_term') return 'Short-term';
  if (type === 'long_term') return 'Long-term';
  return 'N/A';
}

export function getAccommodationTypeColor(type?: 'short_term' | 'long_term'): string {
  if (type === 'short_term') return 'bg-blue-100 text-blue-800';
  if (type === 'long_term') return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
}

export function calculateTotalPrice(
  apartment: Apartment,
  checkIn: Date,
  checkOut: Date
): number {
  const isShortTerm = apartment.accommodation_type === 'short_term';
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  if (isShortTerm) {
    return (apartment.nightly_price || 0) * nights;
  } else {
    const months = Math.ceil(nights / 30);
    return (apartment.price || 0) * months;
  }
}
