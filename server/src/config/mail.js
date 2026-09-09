import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporterPromise = null;

export async function getMailTransporter() {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (env.smtp.host && env.smtp.user) {
      return nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.pass,
        },
      });
    }

    // Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    console.log('[mail] using ethereal test account:', testAccount.user);
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  })();

  return transporterPromise;
}

export async function sendMail({ to, subject, html, text }) {
  const transporter = await getMailTransporter();
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text: text || html?.replace(/<[^>]+>/g, ' '),
  });

  const preview = nodemailer.getTestMessageUrl?.(info);
  if (preview) {
    console.log('[mail] preview URL:', preview);
    info.previewUrl = preview;
  }
  return info;
}
