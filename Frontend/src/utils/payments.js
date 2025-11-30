// src/utils/payments.js
export async function startCheckout({ amount = 10000, currency = "INR" } = {}) {
  // amount in smallest currency unit (paise for INR)
  const res = await fetch("/payments/create-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create session");

  // data.url is Checkout session url returned from server
  if (data.url) {
    window.location.href = data.url; // redirect to Stripe Checkout
  } else {
    throw new Error("No checkout url");
  }
}
