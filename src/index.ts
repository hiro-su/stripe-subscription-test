import Stripe from 'stripe';
import { exit } from 'process';
import moment from 'moment';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2020-03-02' });

(async () => {
  const product = await stripe.products.create({
    name: 'サブスクリプションテスト価格',
  });

  const price = await stripe.prices.create({
    unit_amount: 5500,
    currency: 'jpy',
    product: product.id,
    recurring: { interval: 'month' },
  });

  const billing_cycle_anchor = moment().add({ months: 1 }).startOf('month').unix();

  const customer = await stripe.customers.create({
    name: 'テスト 太郎',
    email: 'user@example.com',
    phone: '0000000000',
  });

  const card = await stripe.customers.createSource(customer.id, { source: 'tok_visa' });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    proration_behavior: 'none',
    billing_cycle_anchor,
  });

  console.log('完了');
  exit(0);
})();
