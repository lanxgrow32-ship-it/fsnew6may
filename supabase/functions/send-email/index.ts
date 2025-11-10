
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

// --- HTML TEMPLATES ARE NOW INLINE ---

const paymentConfirmationHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payment Confirmed & Account Approved!</title>
    <style>
        body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px; }
        .container { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px 0 48px; border: 1px solid #e6ebf1; border-radius: 8px; }
        .heading { color: #1a1a1a; font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; }
        .paragraph { color: #525f7f; font-size: 16px; line-height: 24px; text-align: left; padding: 0 40px; }
        .sub-section { background-color: #f6f9fc; padding: 20px 40px; margin: 0 40px; border-radius: 8px; border: 1px solid #e6ebf1; }
        .sub-heading { color: #1a1a1a; font-size: 18px; font-weight: bold; }
        .button-container { padding: 20px 40px; }
        .button { background-color: #2463eb; border-radius: 5px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: block; width: 100%; padding: 14px 0; }
        hr { border-color: #e6ebf1; margin: 20px 0; }
        .footer { color: #8898aa; font-size: 12px; line-height: 16px; padding: 0 40px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="heading">Payment Confirmed & Account Approved!</h1>
        <p class="paragraph">Hi {{name}},</p>
        <p class="paragraph">Great news! We have successfully received your payment and your account has been approved by our admin team. You are one step closer to trading.</p>
        <div class="sub-section">
            <p class="sub-heading">What's next?</p>
            <p class="paragraph" style="padding: 0;">Your next step is to complete your KYC (Know Your Customer) verification. This is a mandatory step to ensure your account is fully compliant and ready for trading.</p>
        </div>
        <div class="button-container">
            <a class="button" href="https://jxbjdswvrugptnigdguw.supabase.co/kyc-status">Start KYC Verification</a>
        </div>
        <p class="paragraph">If you have any questions, please don't hesitate to contact our support team.</p>
        <hr />
        <p class="footer">FundedStock 2.0</p>
    </div>
</body>
</html>
`;

const kycSubmittedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>KYC Documents Submitted</title>
    <style>
        body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px; }
        .container { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px 0 48px; border: 1px solid #e6ebf1; border-radius: 8px; }
        .heading { color: #1a1a1a; font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; }
        .paragraph { color: #525f7f; font-size: 16px; line-height: 24px; text-align: left; padding: 0 40px; }
        .sub-section { background-color: #f6f9fc; padding: 20px 40px; margin: 0 40px; border-radius: 8px; border: 1px solid #e6ebf1; }
        .sub-heading { color: #1a1a1a; font-size: 18px; font-weight: bold; }
        hr { border-color: #e6ebf1; margin: 20px 0; }
        .footer { color: #8898aa; font-size: 12px; line-height: 16px; padding: 0 40px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="heading">KYC Documents Submitted</h1>
        <p class="paragraph">Hi {{name}},</p>
        <p class="paragraph">Thank you for completing your KYC verification. We have received your documents and they are now under review by our team.</p>
        <div class="sub-section">
            <p class="sub-heading">What happens now?</p>
            <p class="paragraph" style="padding: 0;">Our compliance team will review your submission. This process typically takes 1-2 business days. We will send you another email as soon as your account is verified.</p>
        </div>
        <p class="paragraph">No further action is needed from you at this time.</p>
        <hr />
        <p class="footer">FundedStock 2.0</p>
    </div>
</body>
</html>
`;

const credentialsProvidedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Your Trading Account is Ready!</title>
    <style>
        body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px; }
        .container { background-color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px 0 48px; border: 1px solid #e6ebf1; border-radius: 8px; }
        .heading { color: #1a1a1a; font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; }
        .paragraph { color: #525f7f; font-size: 16px; line-height: 24px; text-align: left; padding: 0 40px; }
        .credentials-section { padding: 0 40px; }
        .credentials-heading { color: #1a1a1a; font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 20px; }
        .credentials-box { background-color: #f6f9fc; padding: 20px; border-radius: 8px; border: 1px solid #e6ebf1; }
        .credential-item { margin: 10px 0; color: #525f7f; font-size: 16px; line-height: 24px; }
        .button-container { padding: 20px 40px; }
        .button { background-color: #2463eb; border-radius: 5px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; text-align: center; display: block; width: 100%; padding: 14px 0; }
        hr { border-color: #e6ebf1; margin: 20px 0; }
        .footer { color: #8898aa; font-size: 12px; line-height: 16px; padding: 0 40px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="heading">Your Trading Account is Ready!</h1>
        <p class="paragraph">Hi {{name}},</p>
        <p class="paragraph">Congratulations! Your account has been fully verified and your trading credentials have been generated. You can now log in to the trading platform and begin your journey.</p>
        <div class="credentials-section">
            <h2 class="credentials-heading">Your Login Details</h2>
            <div class="credentials-box">
                <p class="credential-item"><strong>Username:</strong> {{username}}</p>
                <p class="credential-item"><strong>Password:</strong> {{password}}</p>
                <p class="credential-item"><strong>Server:</strong> Falcon Trader</p>
            </div>
        </div>
        <div class="button-container">
            <a class="button" href="https://nextrade.club/">Launch Trading Platform</a>
        </div>
        <p class="paragraph">Please store these credentials safely and do not share them. If you have any questions, please consult the Trading Guide on your dashboard or contact support.</p>
        <hr />
        <p class="footer">FundedStock 2.0</p>
    </div>
</body>
</html>
`;


function getEmailContent(template: string, params: Record<string, string>): string {
    let html = template;
    for (const key in params) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, params[key]);
    }
    return html;
}

async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!RESEND_API_KEY) {
    const errorMsg = "RESEND_API_KEY is not set. The email function cannot proceed.";
    console.error(errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const resend = new Resend(RESEND_API_KEY);

  try {
    const { event_type, user_name, user_email, trading_username, trading_password } = await req.json();

    let subject = "";
    let htmlContent = "";

    switch (event_type) {
      case "payment_confirmed":
        subject = "Payment Confirmed & Account Approved!";
        htmlContent = getEmailContent(paymentConfirmationHtml, { name: user_name });
        break;
      case "kyc_submitted":
        subject = "KYC Documents Submitted for Review";
        htmlContent = getEmailContent(kycSubmittedHtml, { name: user_name });
        break;
      case "credentials_provided":
        subject = "Your Trading Credentials Are Here!";
        htmlContent = getEmailContent(credentialsProvidedHtml, { 
            name: user_name, 
            username: trading_username, 
            password: trading_password 
        });
        break;
      default:
        throw new Error(`Unknown event type: ${event_type}`);
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user_email,
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error({ message: "Resend API Error", error });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Email sent successfully:", data);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error({ message: "Handler Error", error: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

serve(handler);
