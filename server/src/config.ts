import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name}`);
  return value;
}

const r2Configured = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'].every(
  (k) => process.env[k],
);

export const config = {
  port: Number(process.env.PORT ?? 3000),
  isProd: process.env.NODE_ENV === 'production',
  jwtSecret: required('JWT_SECRET'),
  // TiaraConnect SMS gateway. Without TIARA_API_KEY, codes are printed to the server log outside production.
  tiara: {
    apiKey: process.env.TIARA_API_KEY ?? '',
    senderId: process.env.TIARA_SENDER_ID || 'TIARA',
    baseUrl: (process.env.TIARA_BASE_URL || 'https://api2.tiaraconnect.io').replace(/\/+$/, ''),
  },
  r2: r2Configured
    ? {
        accountId: process.env.R2_ACCOUNT_ID!,
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        bucket: process.env.R2_BUCKET!,
        // Optional: 'eu' or 'fedramp' for jurisdiction-restricted buckets
        jurisdiction: process.env.R2_JURISDICTION || undefined,
      }
    : null,
};
