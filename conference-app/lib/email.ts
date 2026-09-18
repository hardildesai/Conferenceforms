// lib/email.ts
// Email delivery via Resend with inline QR code attachment.

import { Resend } from 'resend';

// Event details — update before launch if anything changes
const EVENT_NAME = 'Exclusive Legrand Experience Evening';
const EVENT_DATE = 'Thursday, 24 September 2026';
const EVENT_VENUE = 'Megma Restaurant and Banquets, 1st Floor & 4th Floor Block A, Girivar Glean Mall, Odhav Rd, Odhav, Ahmedabad, Gujarat 382415';
const EVENT_TIME = '6:30 PM Onwards';

interface SendConfirmationEmailParams {
  to: string;
  visitorName: string;
  companyName: string;
  code: string;
  qrCodeBuffer: Buffer; // PNG buffer from the `qrcode` package
}

export async function sendConfirmationEmail({
  to,
  visitorName,
  companyName,
  code,
  qrCodeBuffer,
}: SendConfirmationEmailParams): Promise<void> {
  // Instantiate at call time so missing env var fails at runtime, not build time
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const html = buildEmailHtml({ visitorName, companyName, code });

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject: `Your Attendance Code for ${EVENT_NAME}`,
    html,
    attachments: [
      {
        filename: `attendance-code-${code}.png`,
        content: qrCodeBuffer,
        contentType: 'image/png',
      },
    ],
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

function buildEmailHtml({
  visitorName,
  companyName,
  code,
}: {
  visitorName: string;
  companyName: string;
  code: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Attendance Code</title>
</head>
<body style="margin:0;padding:0;background:#0f0f13;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a24;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c47ff,#a855f7);padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.8);font-size:13px;text-transform:uppercase;letter-spacing:2px;">You're registered!</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;line-height:1.3;">${EVENT_NAME}</h1>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">${EVENT_DATE} &nbsp;·&nbsp; ${EVENT_TIME}</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">${EVENT_VENUE}</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 40px 0;">
              <p style="margin:0;color:#c8c8d8;font-size:16px;line-height:1.6;">
                Hello <strong style="color:#ffffff;">${visitorName}</strong>,<br/>
                Your registration from <strong style="color:#ffffff;">${companyName}</strong> is confirmed. 
                Please bring your attendance code to the event — show it at the entrance for quick check-in.
              </p>
            </td>
          </tr>

          <!-- Code box -->
          <tr>
            <td style="padding:28px 40px;">
              <div style="background:#0f0f13;border:2px solid #6c47ff;border-radius:12px;padding:32px;text-align:center;">
                <p style="margin:0 0 12px;color:#a0a0c0;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your Attendance Code</p>
                <p style="margin:0;color:#ffffff;font-size:56px;font-weight:800;letter-spacing:12px;font-variant-numeric:tabular-nums;">${code}</p>
                <p style="margin:16px 0 0;color:#7c7c9c;font-size:13px;">QR code attached — you can use either at the entrance</p>
              </div>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0 0 12px;color:#c8c8d8;font-size:15px;font-weight:600;">On event day:</p>
              <ul style="margin:0;padding-left:20px;color:#a0a0c0;font-size:14px;line-height:1.8;">
                <li>Open this email and show your 6-digit code or QR to staff</li>
                <li>Staff will type or scan it for instant check-in</li>
                <li>Keep this email accessible (screenshot recommended)</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#14141e;padding:24px 40px;border-top:1px solid #2a2a3a;text-align:center;">
              <p style="margin:0;color:#5a5a7a;font-size:12px;">
                This is an automated confirmation email. If you did not register, please ignore this message.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
