import crypto from 'crypto';
import express from 'express';
import {
  getListingById,
  getMonitorByAnakinId,
  insertChatMessage,
  updateMonitor
} from '../lib/supabase.js';

export const monitorWebhookRouter = express.Router();

function extractMonitorId(payload) {
  return (
    payload.monitor_id ||
    payload.monitorId ||
    payload.anakin_monitor_id ||
    payload.id ||
    payload.monitor?.id ||
    payload.monitor?.monitor_id ||
    payload.data?.monitor_id ||
    payload.data?.monitorId ||
    payload.data?.id
  );
}

function verifySignature(rawBody, signature, secret) {
  if (!secret || !signature) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
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
  console.log(`[Trip Architect] Monitor webhook received (${rawBody.length} bytes)`);

  try {
    const payload = JSON.parse(rawBody.toString('utf8'));
    const anakinMonitorId = extractMonitorId(payload);
    if (!anakinMonitorId) {
      console.warn(`[Trip Architect] Monitor webhook missing monitor id. Payload keys: ${Object.keys(payload).join(', ')}`);
      return res.status(400).json({ error: 'Monitor id missing from webhook payload.' });
    }

    const monitor = await getMonitorByAnakinId(anakinMonitorId);
    const webhookSecret = monitor.alert_webhook_secret || process.env.MONITOR_WEBHOOK_SECRET;
    if (!verifySignature(rawBody, signature, webhookSecret)) {
      console.warn('[Trip Architect] Monitor webhook rejected: invalid signature');
      return res.status(401).json({ error: 'Invalid signature.' });
    }

    console.log(`[Trip Architect] Monitor webhook verified for monitor ${anakinMonitorId}`);
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

    console.log(`[Trip Architect] Monitor ${anakinMonitorId} updated to ${updatedMonitor.current_price}`);
    return res.json({ status: 'ok' });
  } catch (error) {
    console.error(`[Trip Architect] Monitor webhook failed: ${error.message}`);
    return res.status(400).json({ error: error.message });
  }
});
