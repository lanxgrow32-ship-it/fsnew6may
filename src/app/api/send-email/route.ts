
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

async function getEmailHtml(templateName: string, name: string): Promise<string> {
    const templatePath = path.join(process.cwd(), 'src', 'emails', `${templateName}.html`);
    try {
        let htmlBody = fs.readFileSync(templatePath, 'utf-8');
        htmlBody = htmlBody.replace('{{name}}', name);
        return htmlBody;
    } catch (error) {
        console.error(`Error reading email template ${templateName}:`, error);
        // Fallback to a simple text email if template is missing
        return `<p>Hi ${name}, your account has been approved. Welcome to FundedStock!</p>`;
    }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Security check: Make sure the request is coming from our Supabase trigger
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { record } = body;

    // Basic validation
    if (!record || !record.email || !record.full_name) {
      return NextResponse.json({ error: 'Missing required record data' }, { status: 400 });
    }

    const { email, full_name, kyc_status, credentials_provided } = record;

    let subject = '';
    let htmlBody = '';

    // Determine which email to send based on the user's status
    if (credentials_provided) {
        subject = 'Your Trading Credentials Are Here!';
        htmlBody = await getEmailHtml('credentials-provided', full_name);
    } else if (kyc_status === 'submitted') {
        subject = 'KYC Documents Received';
        htmlBody = await getEmailHtml('kyc-submitted', full_name);
    } else {
        // The default is the payment confirmation email
        subject = 'Payment Confirmation and Account Approved!';
        htmlBody = await getEmailHtml('payment-confirmation', full_name);
    }

    const { data, error: resendError } = await resend.emails.send({
      from: 'FundedStock <onboarding@resend.dev>',
      to: [email],
      subject: subject,
      html: htmlBody,
    });

    if (resendError) {
      console.error('Resend API Error:', resendError);
      return NextResponse.json({ error: resendError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully', data });

  } catch (e: any) {
    console.error('API Route Handler Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
