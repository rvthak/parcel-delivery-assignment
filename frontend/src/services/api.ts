const API_BASE = '/api';

export async function fetchPostcodes(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/postcodes`);
  if (!res.ok) {
    throw await res.json();
  }
  return res.json();
}

export async function createParcel(voucher_id: string, postcode: string) {
  const res = await fetch(`${API_BASE}/parcels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voucher_id, postcode }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data;
}

export async function fetchDrivers(): Promise<{ id: number; name: string }[]> {
  const res = await fetch(`${API_BASE}/drivers`);
  if (!res.ok) {
    throw await res.json();
  }
  return res.json();
}

export async function scanParcel(voucher_id: string) {
  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voucher_id }),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = data as { error: string };
    throw { ...err, status: res.status };
  }
  return data;
}

export async function resetSystem() {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    throw data;
  }
  return data;
}

export function createDriverSSE(driverId: number): EventSource {
  return new EventSource(`${API_BASE}/events/drivers/${driverId}/stats`);
}
