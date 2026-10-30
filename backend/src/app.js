import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { builderRoutes, publicRoutes, uploadDir } from './routes/builder.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.frontendOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts, please try again later.' },
  });
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);

  app.use('/uploads', express.static(uploadDir, { dotfiles: 'deny', immutable: true, maxAge: '7d' }));
  app.use(publicRoutes);
  app.use('/api/builder', builderRoutes);
  app.use('/api', apiRoutes);

  const frontendDir = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
  if (env.nodeEnv === 'production' && existsSync(frontendDir)) {
    app.use(express.static(frontendDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
      res.sendFile(`${frontendDir}/index.html`);
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
