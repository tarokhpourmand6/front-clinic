const BASE_URL = 'http://localhost:5050/api/payment-methods';

export const getPaymentMethods = async () => {
  const res = await fetch(BASE_URL);
  return res.json();
};

export const createPaymentMethod = async (name) => {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
};

export const deletePaymentMethod = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  return res.json();
};

export const updatePaymentMethod = async (id, name) => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
};