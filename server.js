// server.js — Node/Express server for Stripe Checkout sessions
const express = require('express');
const app = express();
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET || 'sk_test_PLACEHOLDER');

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // serve front-end

const PLANS = {
  starter: {amount: 49900, currency: 'usd', name:'Starter Package'},
  growth: {amount: 149900, currency: 'usd', name:'Growth Package'},
  enterprise: {amount: 499900, currency: 'usd', name:'Enterprise Package'},
  logo: {amount: 29900, currency: 'usd', name:'Logo & Branding (from)'},
  web: {amount: 50000, currency: 'usd', name:'Website (deposit)'},
  app: {amount: 200000, currency: 'usd', name:'App & Game (from)'},
  marketing: {amount: 39900, currency: 'usd', name:'Marketing & SEO (from)'},
  integrations: {amount: 25000, currency: 'usd', name:'Integrations (diagnostic)'}
};

app.post('/create-checkout-session', async (req, res) => {
  const { plan } = req.body || {};
  const chosen = PLANS[plan] || PLANS['starter'];
  try{
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: chosen.currency,
          product_data: { name: chosen.name },
          unit_amount: chosen.amount
        },
        quantity: 1
      }],
      success_url: (req.headers.origin || 'http://localhost:4242') + '/?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: (req.headers.origin || 'http://localhost:4242') + '/?canceled=true'
    });
    res.json({ sessionId: session.id, publishableKey: process.env.STRIPE_PUBLISHABLE || 'pk_test_PLACEHOLDER' });
  }catch(err){
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, ()=> console.log('Server running on http://localhost:' + PORT));
