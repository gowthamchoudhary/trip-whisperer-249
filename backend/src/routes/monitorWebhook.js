import crypto from 'crypto';
import express from 'express';
import {
  getListingById,
  getMonitorByAnakinId,
  insertChatMessage,
  updateMonitor
} from '../lib/supabase.js';

export const monitorWebhookRouter = express.Router();

function verifySignature(rawBody, signature) {
  if (!process.env.MONITOR_WEBHOOK_SECRET || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', process.env.MONITOR_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const actual = signature.replace(/^sha256=/, '');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(actual, 'hex');
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

monitorWebhookRouter.post('/monitor-alert', async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const signature = req.get('X-Anakin-Signature');

  if (!verifySignature(rawBody, signature)) {
    return res.status(401).json({ error: 'Invalid signature.' });
  }

  try {
    const payload = JSON.parse(rawBody.toString('utf8'));
    const anakinMonitorId = payload.monitor_id || payload.anakin_monitor_id || payload.id;
    const monitor = await getMonitorByAnakinId(anakinMonitorId);
    const priceHistory = Array.isArray(monitor.price_history) ? monitor.price_history : [];
    const currentPrice = Number(payload.current_price || payload.price || monitor.current_price);
    const checkedAt = payload.checked_at || new Date().toISOString();

    const updatedMonitor = await updateMonitor(monitor.id, {
      current_price: currentPrice,
      last_checked_at: checkedAt,
      price_history: [
        ...priceHistory,
        {
          price: currentPrice,
          currency: payload.currency || payload.current_currency || 'INR',
          checked_at: checkedAt
        }
      ],
      status: payload.status || monitor.status
    });

    const listing = await getListingById(monitor.listing_id);
    await insertChatMessage(
      listing.trip_request_id,
      'assistant',
      `Price alert: ${listing.listing_name} is now ${updatedMonitor.current_price} ${listing.currency || 'INR'}.`
    );

    return res.json({ status: 'ok' });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});
