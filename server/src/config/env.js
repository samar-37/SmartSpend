import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
};

if (!env.mongoUri) throw new Error('MONGODB_URI is required');
if (!env.jwtAccessSecret || !env.jwtRefreshSecret) throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required');
