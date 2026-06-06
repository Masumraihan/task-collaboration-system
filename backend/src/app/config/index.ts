import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  database_url: process.env.DATABASE_URL,
  server_url: process.env.SERVER_URL,
  port: process.env.PORT,
  socket_port: process.env.SOCKET_PORT,
  ip: process.env.IP,
  nodeEnv: process.env.NODE_ENV,
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,

  jwt: {
    jwtAccessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
    jwtAccessTokenExpires: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,

    jwtRefreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
    jwtRefreshTokenExpires: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,

    forgetPasswordSecret: process.env.FORGOT_PASSWORD_SECRET,
    forgetPasswordExpires: process.env.FORGOT_PASSWORD_EXPIRATION_TIME,

    tempUserTokenSecret: process.env.TEMP_USER_TOKEN_SECRET,
    tempUserTokenExpires: process.env.TEMP_USER_TOKEN_EXPIRATION_TIME,
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_BUCKET,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },

  payment: {
    secretKey: process.env.PAYMENT_GATEWAY_SECRET_KEY,
    webHookKey: process.env.WEB_HOOK_SECRET_KEY,
    paymentSuccessUrl: process.env.PAYMENT_SUCCESS_URL,
    paymentCancelUrl: process.env.PAYMENT_CANCEL_URL,
    webHookUrl: process.env.WEB_HOOK_URL,
    jobPostWebHookUrl: process.env.JOB_POST_WEB_HOOK_URL,
  },
  rateLimitWindow: process.env.RATE_LIMIT_WINDOW,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  msegatApiKey: process.env.MSEGAT_API_KEY,
  tapSecretKey: process.env.TAP_SECRET_KEY,
  qoyodApiKey: process.env.QOYOD_API_KEY,
  elmUsername: process.env.ELM_USERNAME,
  elmPassword: process.env.ELM_PASSWORD,
  elmAppId: process.env.ELM_APP_ID,
  elmAppKey: process.env.ELM_APP_KEY,
  elmOperatorId: process.env.ELM_OPERATOR_ID,
  google: {
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
    projectId: process.env.GOOGLE_PROJECT_ID,
  },
  aliAccessKeyId: process.env.ALI_ACCESS_KEY_ID,
  aliAccessKeySecret: process.env.ALI_ACCESS_KEY_SECRET,
  aliOssRegion: process.env.ALI_OSS_REGION,
  aliOssBucketName: process.env.ALI_OSS_BUCKET_NAME,
};
