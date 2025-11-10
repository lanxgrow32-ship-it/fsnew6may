import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PaymentConfirmationEmailProps {
  name: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const PaymentConfirmationEmail = ({
  name,
}: PaymentConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your account has been approved and is ready for the next step!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/static/fundedstock-logo.png`}
          width="40"
          height="40"
          alt="FundedStock"
        />
        <Heading style={heading}>Payment Confirmed & Account Approved!</Heading>
        <Text style={paragraph}>Hi {name},</Text>
        <Text style={paragraph}>
          Great news! We have successfully received your payment and your account has been approved by our admin team. You are one step closer to trading.
        </Text>
        <Section style={subSection}>
          <Text style={subHeading}>What's next?</Text>
          <Text style={paragraph}>
            Your next step is to complete your KYC (Know Your Customer) verification. This is a mandatory step to ensure your account is fully compliant and ready for trading.
          </Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={`${baseUrl}/kyc-status`}>
            Start KYC Verification
          </Button>
        </Section>
        <Text style={paragraph}>
          If you have any questions, please don't hesitate to contact our support team.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          FundedStock 2.0
        </Text>
      </Container>
    </Body>
  </Html>
);

PaymentConfirmationEmail.defaultProps = {
  name: "Valued Trader",
};

export default PaymentConfirmationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #e6ebf1",
  borderRadius: "8px",
};

const heading = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const subHeading = {
    color: "#1a1a1a",
    fontSize: "18px",
    fontWeight: "bold",
}

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  padding: "0 40px",
};

const subSection = {
    backgroundColor: "#f6f9fc",
    padding: '20px 40px',
    margin: '0 40px',
    borderRadius: '8px',
    border: '1px solid #e6ebf1',
};

const buttonContainer = {
  padding: "20px 40px",
};

const button = {
  backgroundColor: "#2463eb",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  width: "100%",
  padding: "14px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 40px",
};
