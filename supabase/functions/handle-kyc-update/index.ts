import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    const { record, old_record } = await req.json();

    if (!record || !record.email) {
      console.warn("Received invalid payload or missing email:", { record });
      return new Response(JSON.stringify({ message: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userEmail = record.email;
    const userName = record.full_name || 'Trader';
    let emailSubject = '';
    let emailHtml = '';
    let shouldSend = false;

    // --- Logic for KYC Status Change ---
    const oldKycStatus = old_record?.kyc_status;
    const newKycStatus = record.kyc_status;

    if (newKycStatus !== oldKycStatus) {
      switch (newKycStatus) {
        case 'verified':
          shouldSend = true;
          emailSubject = 'Congratulations! Your KYC is Verified';
          emailHtml = `
            <h1>KYC Approved!</h1>
            <p>Hi ${userName},</p>
            <p>Great news! Your KYC documents have been successfully verified.</p>
            <p>Your trading credentials will now be generated and provided on your dashboard shortly. Please check back soon to begin trading.</p>
            <p>Happy Trading!</p>
            <p>The FundedStock Team</p>
          `;
          break;

        case 'rejected':
          shouldSend = true;
          emailSubject = 'Action Required: Your KYC Verification';
          emailHtml = `
            <h1>KYC Verification Update</h1>
            <p>Hi ${userName},</p>
            <p>Unfortunately, we were unable to approve your recent KYC submission. This may be due to unclear documents or incorrect information.</p>
            <p>Please log in to your account to check your status and resubmit your documents for verification.</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>The FundedStock Team</p>
          `;
          break;
      }
    }
    
    // --- Send the email if needed ---
    if (shouldSend) {
        const { data, error } = await resend.emails.send({
          from: "FundedStock <noreply@fundedstock.io>",
          to: [userEmail],
          subject: emailSubject,
          html: emailHtml,
        });

        if (error) {
          console.error("Error sending email:", error);
          return new Response(JSON.stringify(error), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ message: "No relevant changes detected to send an email." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Overall function error:", err);
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
