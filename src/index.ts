import Stripe from 'stripe';
import { exit } from 'process';
import moment from 'moment';
import crypto from 'crypto';

const userName = crypto.randomBytes(16).toString('base64').substring(0, 16);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2020-03-02' });

(async () => {
  const product = await stripe.products.create({
    name: `サブスクリプションテスト価格-${userName}`,
  });

  const price = await stripe.prices.create({
    unit_amount: 5500,
    currency: 'jpy',
    product: product.id,
    recurring: { interval: 'month' },
  });

  const billing_cycle_anchor = moment().add({ months: 1 }).startOf('month').unix();

  const customer = await stripe.customers.create({
    name: userName,
  });

  const card = await stripe.customers.createSource(customer.id, { source: 'tok_visa' });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    proration_behavior: 'none',
    billing_cycle_anchor,
  });

  const updatePrice = await stripe.prices.create({
    unit_amount: 11000,
    currency: 'jpy',
    product: product.id,
    recurring: { interval: 'month' },
  });

  await stripe.subscriptions.update(subscription.id, {
    proration_behavior: 'none',
    cancel_at_period_end: true,
  });

  await stripe.subscriptionSchedules.create({
    from_subscription: subscription.id,
  });

  const start_date = moment().add({ months: 2 }).startOf('month').unix();
  const suchedule = await stripe.subscriptionSchedules.create({
    customer: customer.id,
    start_date,
    end_behavior: 'release',
    phases: [{ plans: [{ price: updatePrice.id }] }],
  });

  console.log(suchedule);

  console.log('完了');
  exit(0);
})();
