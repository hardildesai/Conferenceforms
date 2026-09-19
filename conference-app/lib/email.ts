// lib/email.ts
// Email delivery via Resend with custom templates and inline QR code attachment.

import { Resend } from 'resend';

const EVENT_NAME = 'Exclusive Legrand Experience Evening';
const EVENT_DATE = 'Thursday, 24 September 2026';
const EVENT_VENUE = 'Megma Restaurant and Banquets, Odhav, Ahmedabad';
const EVENT_TIME = '6:30 PM Onwards';
const EVENT_MAPS_LINK = 'https://maps.app.goo.gl/Jy4kNUzK9vDzrpjk6';

interface SendConfirmationEmailParams {
  to: string;
  visitorName: string;
  companyName: string;
  designation?: string;
  code: string;
  qrCodeBuffer: Buffer;
  customSubject?: string;
  customBody?: string;
}

export function substitutePlaceholders(
  template: string,
  data: {
    visitorName: string;
    companyName: string;
    designation?: string;
    code: string;
  }
): string {
  return template
    .replace(/\{name\}/gi, data.visitorName)
    .replace(/\{visitor_name\}/gi, data.visitorName)
    .replace(/\{code\}/gi, data.code)
    .replace(/\{company\}/gi, data.companyName)
    .replace(/\{company_name\}/gi, data.companyName)
    .replace(/\{designation\}/gi, data.designation ?? '')
    .replace(/\{event_name\}/gi, EVENT_NAME)
    .replace(/\{date\}/gi, EVENT_DATE)
    .replace(/\{venue\}/gi, EVENT_VENUE)
    .replace(/\{maps_link\}/gi, EVENT_MAPS_LINK)
    .replace(/\{time\}/gi, EVENT_TIME);
}

export async function sendConfirmationEmail({
  to,
  visitorName,
  companyName,
  designation,
  code,
  qrCodeBuffer,
  customSubject,
  customBody,
}: SendConfirmationEmailParams): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY!);

  const subject = customSubject
    ? substitutePlaceholders(customSubject, { visitorName, companyName, designation, code })
    : `Your Entry Pass & Code for ${EVENT_NAME}`;

  const html = buildEmailHtml({ visitorName, companyName, designation, code, customBody });

  const attachments = qrCodeBuffer && qrCodeBuffer.length > 0 ? [
    {
      filename: `attendance-code-${code}.png`,
      content: qrCodeBuffer,
      contentType: 'image/png',
    },
  ] : [];

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject,
    html,
    attachments,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

function buildEmailHtml({
  visitorName,
  companyName,
  designation,
  code,
  customBody,
}: {
  visitorName: string;
  companyName: string;
  designation?: string;
  code: string;
  customBody?: string;
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const logoUrl = `${appUrl}/legrand-logo.png`;

  let mainBodyText = `
    Hello <strong style="color:#111111;">${visitorName}</strong>,<br/><br/>
    Your registration from <strong style="color:#111111;">${companyName}</strong> (${designation || 'Guest'}) is confirmed for the <strong>Legrand Experience Evening</strong>.<br/>
    Please show your attendance code or QR code at the entrance for quick digital check-in.
  `;

  if (customBody?.trim()) {
    const substituted = substitutePlaceholders(customBody, { visitorName, companyName, designation, code });
    mainBodyText = substituted.replace(/\n/g, '<br/>');
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Legrand Attendance Code</title>
</head>
<body style="margin:0;padding:0;background:#f4f3ef;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ef;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;border:1px solid #e0dbce;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
          
          <!-- Legrand Header Banner -->
          <tr>
            <td style="background:#111111;padding:24px 32px;text-align:center;border-bottom:3px solid #c8973a;">
              <div style="background:#ffffff;display:inline-block;padding:8px 24px;border-radius:8px;margin-bottom:12px;">
                <img src="${logoUrl}" alt="Legrand" height="28" style="display:block;height:28px;width:auto;" />
              </div>
              <p style="margin:6px 0 0;color:#c8973a;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Exclusive Experience Evening</p>
            </td>
          </tr>

          <!-- Event Title -->
          <tr>
            <td style="background:linear-gradient(135deg,#e2000f,#b0000b);padding:28px 32px;text-align:center;color:#ffffff;">
              <h1 style="margin:0;font-size:22px;font-weight:700;line-height:1.3;color:#ffffff;">${EVENT_NAME}</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${EVENT_DATE} &nbsp;·&nbsp; ${EVENT_TIME}</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${EVENT_VENUE}</p>
              <div style="margin-top:12px;">
                <a href="${EVENT_MAPS_LINK}" target="_blank" style="display:inline-block;background:#ffffff;color:#e2000f;text-decoration:none;font-weight:700;font-size:12px;padding:6px 14px;border-radius:20px;">🗺️ View Venue on Google Maps ↗</a>
              </div>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding:32px 36px 12px;">
              <p style="margin:0;color:#333333;font-size:15px;line-height:1.6;">
                ${mainBodyText}
              </p>
            </td>
          </tr>

          <!-- Attendance Code Box -->
          <tr>
            <td style="padding:20px 36px 28px;">
              <div style="background:#fdfcf9;border:2px dashed #c8973a;border-radius:12px;padding:24px;text-align:center;">
                <p style="margin:0 0 8px;color:#888888;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your Unique Attendance Code</p>
                <p style="margin:0;color:#e2000f;font-size:44px;font-weight:800;letter-spacing:8px;font-family:monospace;">${code}</p>
                <p style="margin:12px 0 0;color:#666666;font-size:12px;">Present this code or the attached QR code image at the entrance scanner.</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f7f4;padding:20px 36px;border-top:1px solid #eee8db;text-align:center;">
              <p style="margin:0;color:#888888;font-size:12px;">
                Legrand India · Exclusive Event Registration System
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

