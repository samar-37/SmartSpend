import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requireCsrf } from './middleware/csrfMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import userRoutes from './routes/userRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import recurringPaymentRoutes from './routes/recurringPaymentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import savingsGoalRoutes from './routes/savingsGoalRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { runNotificationJobs } from './services/notificationService.js';
import { runRecurringPaymentJobs } from './services/recurringPaymentService.js';
import insightRoutes from './routes/insightRoutes.js';
import forecastRoutes from './routes/forecastRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requireCsrf);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/recurring-payments', recurringPaymentRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/savings-goals', savingsGoalRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/insights', insightRoutes);
app.use('/api/v1/forecasts', forecastRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function startServer() {
  await connectDatabase();
  app.listen(env.port, () => {
    console.log(`SmartSpend API listening on http://localhost:${env.port}`);
    const run = () => Promise.all([runNotificationJobs(), runRecurringPaymentJobs()]).catch((error) => console.error('Background scheduler failed', error));
    run();
    setInterval(run, 15 * 60 * 1000).unref();
  });
}

startServer().catch((error) => {
  console.error('Unable to start server', error);
  process.exitCode = 1;
});
