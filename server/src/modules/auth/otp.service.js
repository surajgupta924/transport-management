import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { EmailOtp } from './otp.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { sendMail } from '../../config/mail.js';
import { otpEmail } from '../../jobs/emailTemplates.js';

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_TOKEN_TTL = '20m';

function sixDigit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtp({ email, purpose = 'BOOKING' }) {
  const normalized = String(email).toLowerCase().trim();
  const code = sixDigit();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await EmailOtp.updateMany({ email: normalized, purpose, consumed: false }, { $set: { consumed: true } });
  await EmailOtp.create({ email: normalized, purpose, codeHash, expiresAt });

  let previewUrl = null;
  try {
    const mail = otpEmail({ email: normalized, code, purpose });
    const info = await sendMail({ to: normalized, subject: mail.subject, html: mail.html });
    previewUrl = info?.previewUrl || null;
  } catch (err) {
    console.error('[otp] email send failed:', err.message);
    throw new ApiError(502, 'Could not send OTP email. Check SMTP settings or try again.');
  }

  const data = {
    email: normalized,
    expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    message: `OTP sent to ${normalized}`,
  };
  if (!env.isProd) {
    data.devOtp = code;
    if (previewUrl) data.previewUrl = previewUrl;
  }
  return data;
}

export async function verifyOtp({ email, code, purpose = 'BOOKING' }) {
  const normalized = String(email).toLowerCase().trim();
  const record = await EmailOtp.findOne({
    email: normalized,
    purpose,
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new ApiError(400, 'OTP expired or not found. Request a new code.');
  }
  if (record.attempts >= 5) {
    record.consumed = true;
    await record.save();
    throw new ApiError(429, 'Too many incorrect attempts. Request a new OTP.');
  }

  const ok = await bcrypt.compare(String(code), record.codeHash);
  if (!ok) {
    record.attempts += 1;
    await record.save();
    throw new ApiError(400, 'Invalid OTP');
  }

  record.consumed = true;
  await record.save();

  const otpToken = jwt.sign({ email: normalized, purpose, typ: 'otp' }, env.jwt.accessSecret, {
    expiresIn: OTP_TOKEN_TTL,
  });

  return { email: normalized, otpToken, verified: true };
}

export function assertOtpToken(otpToken, email) {
  if (!otpToken) {
    throw new ApiError(400, 'Email OTP verification is required before booking');
  }
  try {
    const decoded = jwt.verify(otpToken, env.jwt.accessSecret);
    if (decoded.typ !== 'otp' || decoded.purpose !== 'BOOKING') {
      throw new Error('bad purpose');
    }
    if (email && decoded.email !== String(email).toLowerCase().trim()) {
      throw new ApiError(400, 'OTP was issued for a different email');
    }
    return decoded;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(400, 'OTP session expired. Verify email again.');
  }
}
