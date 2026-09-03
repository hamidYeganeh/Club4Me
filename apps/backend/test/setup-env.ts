process.env.NODE_ENV = "test";
process.env.PORT = "7088";
process.env.MONGODB_URL =
  process.env.MONGODB_URL ?? "mongodb://127.0.0.1:27017/club4me-test";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
process.env.JWT_SECRET = "test-jwt-secret-value";
process.env.JWT_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "30d";
process.env.KAVENEGAR_OTP_TEMPLATE = "verify";
process.env.CORS_ORIGINS = "http://localhost:7080";
