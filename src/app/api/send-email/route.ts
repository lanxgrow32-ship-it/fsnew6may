
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { record } = body;

    // Basic validation
    if (!record || !record.email || !record.full_name) {
      return NextResponse.json({ error: 'Missing required record data' }, { status: 400 });
    }

    const { email, full_name } = record;

    // Read the simple HTML template
    // The path is relative to the project root
    const templatePath = path.join(process.cwd(), 'src', 'emails', 'payment-confirmation.html');
    let htmlBody = fs.readFileSync(templatePath, 'utf-8');
    
    // Replace placeholder
    htmlBody = htmlBody.replace('{{name}}', full_name);

    const { data, error } = await resend.emails.send({
      from: 'FundedStock <onboarding@resend.dev>',
      to: [email],
      subject: 'Payment Confirmation and Account Approval',
      html: htmlBody,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Email sent successfully', data });

  } catch (e: any) {
    console.error('Handler Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
