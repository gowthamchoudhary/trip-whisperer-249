import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { monitorWebhookRouter } from './routes/monitorWebhook.js';
import { planTripRouter } from './routes/planTrip.js';

const app = express();
const port = process.env.PORT || 4000;

app.use((req, res, next) => {
  console.log(`[CORS DEBUG] ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(cors({
  origin: true,
  credentials: true
}));

app.options('*', cors({ origin: true, credentials: true }));

app.use('/api/webhook', express.raw({ type: '*/*' }), monitorWebhookRouter);
app.use(express.json());
app.use('/api', planTripRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`[Trip Architect] Backend listening on port ${port}`);
});
