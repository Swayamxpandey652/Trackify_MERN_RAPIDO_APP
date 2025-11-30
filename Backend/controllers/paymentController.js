// controllers/paymentController.js
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency = "INR" } = req.body;
    // create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "Ride Payment" },
            unit_amount: amount, // smallest currency unit
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5000"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5000"}/payment-cancel`,
      metadata: {
        driverId: req.user?.id || "driver-demo",
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe create session error", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
};
