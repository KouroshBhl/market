export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  app: {
    name: process.env.APP_NAME || 'Market API',
    version: process.env.APP_VERSION || '0.0.1',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
});
