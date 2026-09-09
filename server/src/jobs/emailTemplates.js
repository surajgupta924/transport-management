export function welcomeEmail({ name, email }) {
  return {
    subject: 'Welcome to TMS',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2>Welcome, ${name || email}</h2>
        <p>Your Transport Management System account is ready.</p>
        <p>You can sign in using <strong>${email}</strong>.</p>
      </div>
    `,
  };
}

export function bookingConfirmationEmail({ bookingNumber, customerName }) {
  return {
    subject: `Booking confirmed: ${bookingNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2>Booking Confirmed</h2>
        <p>Hi ${customerName || 'Customer'},</p>
        <p>Your booking <strong>${bookingNumber}</strong> has been confirmed.</p>
      </div>
    `,
  };
}

export function invoiceEmail({ invoiceNumber, total, customerName }) {
  return {
    subject: `Invoice ${invoiceNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2>Invoice ${invoiceNumber}</h2>
        <p>Hi ${customerName || 'Customer'},</p>
        <p>An invoice totaling <strong>${total}</strong> has been issued.</p>
      </div>
    `,
  };
}

export function otpEmail({ email, code, purpose }) {
  const reason = purpose === 'BOOKING' ? 'confirm your booking request' : 'verify your account';
  return {
    subject: `Your SwiftHaul OTP is ${code}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="margin:0 0 8px;color:#0f172a">Email verification</h2>
        <p>Use this one-time password to ${reason} for <strong>${email}</strong>.</p>
        <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#b45309;margin:24px 0">${code}</p>
        <p style="color:#64748b;font-size:13px">This code expires in 10 minutes. Do not share it.</p>
      </div>
    `,
  };
}

export function documentExpiryEmail({ entityName, docType, expiryDate }) {
  return {
    subject: `Document expiry reminder: ${docType}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
        <h2>Document Expiry Reminder</h2>
        <p><strong>${docType}</strong> for <strong>${entityName}</strong> expires on <strong>${expiryDate}</strong>.</p>
      </div>
    `,
  };
}
