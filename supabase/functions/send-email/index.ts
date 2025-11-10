
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to read and prepare the email template
async function getEmailHtml(templateName: string, params: Record<string, string>): Promise<string> {
    // Deno.readTextFile is the correct way to read files in Supabase Edge Functions.
    // The path is relative to the root of the Supabase project directory.
    const templatePath = `./supabase/functions/send-email/${templateName}.html`;
    let html = await Deno.readTextFile(templatePath);

    for (const key in params) {
        // Use a global regex to replace all occurrences of the placeholder
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, params[key]);
    }
    return html;
}

async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!resend) {
    const errorMsg = "RESEND_API_KEY is not set. The email function cannot proceed.";
    console.error(errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { event_type, user_name, user_email, trading_username, trading_password } = await req.json();

    let subject = "";
    let emailHtml = "";
    let params: Record<string, string> = { name: user_name };

    switch (event_type) {
      case "payment_confirmed":
        subject = "Payment Confirmed & Account Approved!";
        emailHtml = await getEmailHtml('payment-confirmation', { name: user_name });
        break;
      case "kyc_submitted":
        subject = "KYC Documents Submitted for Review";
        emailHtml = await getEmailHtml('kyc-submitted', { name: user_name });
        break;
      case "credentials_provided":
        subject = "Your Trading Credentials Are Here!";
        emailHtml = await getEmailHtml('credentials-provided', { 
            name: user_name, 
            username: trading_username, 
            password: trading_password 
        });
        break;
      default:
        throw new Error(`Unknown event type: ${event_type}`);
    }

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: user_email,
      subject: subject,
      html: emailHtml,
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
