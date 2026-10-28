import { getAuthHeaders } from '@/lib/auth';
import { getCacheTag } from './cache-tags';
import {
  CustomersSummaryResponse,
  HourlyActivityResponse,
  OtherPaymentsSummaryResponse,
  ReceiptsSummaryResponse,
  RevenueSummaryResponse,
} from '@/types/dashboard.type';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type DateRange = { from?: string; to?: string; groupBy?: 'day' | 'month' };

const buildQuery = (params: DateRange) => {
  const search = new URLSearchParams();
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.groupBy) search.set('groupBy', params.groupBy);
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const getRevenueSummary = async (params: DateRange, authToken?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/box-lists/summary${buildQuery(params)}`, {
      headers: await getAuthHeaders(authToken),
      next: { tags: [getCacheTag('dashboard', 'all')] },
    });
    const data = await response.json();
    if (response.ok) return data as RevenueSummaryResponse;
    console.error(data);
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getOtherPaymentsSummary = async (params: DateRange, authToken?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/box-lists/otherPayment/summary${buildQuery(params)}`, {
      headers: await getAuthHeaders(authToken),
      next: { tags: [getCacheTag('dashboard', 'all')] },
    });
    const data = await response.json();
    if (response.ok) return data as OtherPaymentsSummaryResponse;
    console.error(data);
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getReceiptsSummary = async (params: DateRange, authToken?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/receipts/summary${buildQuery(params)}`, {
      headers: await getAuthHeaders(authToken),
      next: { tags: [getCacheTag('dashboard', 'all')] },
    });
    const data = await response.json();
    if (response.ok) return data as ReceiptsSummaryResponse;
    console.error(data);
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getCustomersSummary = async (params: DateRange, authToken?: string) => {
  try {
    const response = await fetch(`${BASE_URL}/customers/summary${buildQuery(params)}`, {
      headers: await getAuthHeaders(authToken),
      next: { tags: [getCacheTag('dashboard', 'all')] },
    });
    const data = await response.json();
    if (response.ok) return data as CustomersSummaryResponse;
    console.error(data);
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getHourlyActivity = async (date?: string, authToken?: string) => {
  try {
    const query = date ? `?date=${date}` : '';
    const response = await fetch(`${BASE_URL}/tickets/registrations/hourly-activity${query}`, {
      headers: await getAuthHeaders(authToken),
      next: { tags: [getCacheTag('dashboard', 'all')] },
    });
    const data = await response.json();
    if (response.ok) return data as HourlyActivityResponse;
    console.error(data);
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
