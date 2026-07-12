import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { monitorWebhookRouter } from './routes/monitorWebhook.js';
import { planTripRouter } from './routes/planTrip.js';

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = (
  process.env.FRONTEND_ORIGIN ||
  'http://localhost:5173,http://127.0.0.1:5173,https://trip-whisperer-249.vercel.app'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));

app.use('/api/webhook', express.raw({ type: '*/*' }), monitorWebhookRouter);
app.use(express.json());
app.use('/api', planTripRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`[Trip Architect] Backend listening on port ${port}`);
});
