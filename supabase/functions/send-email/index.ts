
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

async function getEmailHtml(templateName: string, params: Record<string, string>): Promise<string> {
    // Corrected Path: The path should be relative to the function's root.
    const templatePath = `./${templateName}.html`;
    try {
        let html = await Deno.readTextFile(templatePath);

        for (const key in params) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, params[key]);
        }
        return html;
    } catch (e) {
        console.error(`Error reading or processing template ${templatePath}:`, e.message);
        throw new Error(`path not found: ${templatePath}: ${e.message}`);
    }
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
        htmlContent = await getEmailHtml('payment-confirmation', { name: user_name });
        break;
      case "kyc_submitted":
        subject = "KYC Documents Submitted for Review";
        htmlContent = await getEmailHtml('kyc-submitted', { name: user_name });
        break;
      case "credentials_provided":
        subject = "Your Trading Credentials Are Here!";
        htmlContent = await getEmailHtml('credentials-provided', { 
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
