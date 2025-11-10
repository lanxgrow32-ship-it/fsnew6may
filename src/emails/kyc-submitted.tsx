import {
  Body,
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

interface KycSubmittedEmailProps {
  name: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const KycSubmittedEmail = ({
  name,
}: KycSubmittedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your KYC documents have been successfully submitted.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/static/fundedstock-logo.png`}
          width="40"
          height="40"
          alt="FundedStock"
        />
        <Heading style={heading}>KYC Documents Submitted</Heading>
        <Text style={paragraph}>Hi {name},</Text>
        <Text style={paragraph}>
          Thank you for completing your KYC verification. We have received your documents and they are now under review by our team.
        </Text>
        <Section style={subSection}>
          <Text style={subHeading}>What happens now?</Text>
          <Text style={paragraph}>
            Our compliance team will review your submission. This process typically takes 1-2 business days. We will send you another email as soon as your account is verified.
          </Text>
        </Section>
        <Text style={paragraph}>
          No further action is needed from you at this time.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          FundedStock 2.0
        </Text>
      </Container>
    </Body>
  </Html>
);

KycSubmittedEmail.defaultProps = {
  name: "Valued Trader",
};

export default KycSubmittedEmail;

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
