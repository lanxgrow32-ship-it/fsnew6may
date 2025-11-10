import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.4.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  try {
    const { record } = await req.json();

    // Ensure we have a record and an email to send to
    if (!record || !record.email) {
      console.warn("Received invalid payload or missing email:", { record });
      return new Response(JSON.stringify({ message: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const kycStatus = record.kyc_status;
    const userEmail = record.email;
    const userName = record.full_name || 'Trader';

    let emailSubject = '';
    let emailHtml = '';

    switch (kycStatus) {
      case 'submitted':
        emailSubject = 'KYC Documents Submitted Successfully';
        emailHtml = `
          <h1>Thank You For Your Submission!</h1>
          <p>Hi ${userName},</p>
          <p>We have successfully received your KYC documents. Our team will review them shortly.</p>
          <p>This process usually takes 1-2 business days. We will notify you once the review is complete.</p>
          <p>The FundedStock Team</p>
        `;
        break;

      case 'verified':
        emailSubject = 'Congratulations! Your KYC is Verified';
        emailHtml = `
          <h1>KYC Approved!</h1>
          <p>Hi ${userName},</p>
          <p>Great news! Your KYC documents have been successfully verified and your account is now fully active.</p>
          <p>Your trading credentials will be provided on your dashboard shortly. Please check back soon to begin trading.</p>
          <p>Happy Trading!</p>
          <p>The FundedStock Team</p>
        `;
        break;

      case 'rejected':
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
      
      default:
        // If the status is 'pending' or something else, we don't send an email.
        return new Response(JSON.stringify({ message: `No email sent for status: ${kycStatus}` }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
    }

    // Send the email using Resend
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

  } catch (err) {
    console.error("Overall function error:", err);
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
