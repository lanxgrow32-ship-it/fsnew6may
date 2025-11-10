import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend";

// Import the email components.
// Note: The paths might seem unusual. This is how Deno and Supabase functions
// import shared code from the main project source.
import PaymentConfirmationEmail from "../../../src/emails/payment-confirmation.tsx";
import KycSubmittedEmail from "../../../src/emails/kyc-submitted.tsx";
import CredentialsProvidedEmail from "../../../src/emails/credentials-provided.tsx";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function handler(req: Request) {
  // This is needed for the Supabase client library to work.
  // It's a preflight request that asks for permission to make the actual request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { event_type, user_name, user_email, trading_username, trading_password } = await req.json();

    let subject = "";
    let emailComponent;

    switch (event_type) {
      case "payment_confirmed":
        subject = "Payment Confirmed & Account Approved!";
        emailComponent = PaymentConfirmationEmail({ name: user_name });
        break;
      case "kyc_submitted":
        subject = "KYC Documents Submitted for Review";
        emailComponent = KycSubmittedEmail({ name: user_name });
        break;
      case "credentials_provided":
        subject = "Your Trading Credentials Are Here!";
        emailComponent = CredentialsProvidedEmail({
          name: user_name,
          username: trading_username,
          password: trading_password,
          loginUrl: "https://nextrade.club/",
        });
        break;
      default:
        throw new Error(`Unknown event type: ${event_type}`);
    }
    
    if (!RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not set in environment variables.");
    }

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Use the default, verified Resend address
      to: user_email,
      subject: subject,
      react: emailComponent,
    });

    if (error) {
      console.error({ error });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

serve(handler);
