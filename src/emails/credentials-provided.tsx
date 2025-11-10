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
} from "https://esm.sh/@react-email/components@0.0.19";
import * as React from "https://esm.sh/react@18.2.0";

interface CredentialsProvidedEmailProps {
  name: string;
  username: string;
  password?: string;
  loginUrl: string;
}

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const CredentialsProvidedEmail = ({
  name,
  username,
  password,
  loginUrl,
}: CredentialsProvidedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your Trading Credentials are here!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/static/fundedstock-logo.png`}
          width="40"
          height="40"
          alt="FundedStock"
        />
        <Heading style={heading}>Your Trading Account is Ready!</Heading>
        <Text style={paragraph}>Hi {name},</Text>
        <Text style={paragraph}>
          Congratulations! Your account has been fully verified and your trading credentials have been generated. You can now log in to the trading platform and begin your journey.
        </Text>
        <Section style={credentialsSection}>
          <Text style={credentialsHeading}>Your Login Details</Text>
          <div style={credentialsBox}>
            <Text style={credentialItem}>
              <strong>Username:</strong> {username}
            </Text>
            <Text style={credentialItem}>
              <strong>Password:</strong> {password}
            </Text>
             <Text style={credentialItem}>
              <strong>Server:</strong> Falcon Trader
            </Text>
          </div>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Launch Trading Platform
          </Button>
        </Section>
        <Text style={paragraph}>
          Please store these credentials safely and do not share them. If you have any questions, please consult the Trading Guide on your dashboard or contact support.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          FundedStock 2.0
        </Text>
      </Container>
    </Body>
  </Html>
);

CredentialsProvidedEmail.defaultProps = {
  name: "Valued Trader",
  username: "FS123456",
  password: "yourpassword",
  loginUrl: "https://nextrade.club/",
};

export default CredentialsProvidedEmail;

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

const paragraph = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  padding: "0 40px",
};

const credentialsSection = {
  padding: "0 40px",
};

const credentialsHeading = {
    color: "#1a1a1a",
    fontSize: "18px",
    fontWeight: "bold",
    textAlign: "center" as const,
    marginBottom: "20px",
};

const credentialsBox = {
    backgroundColor: "#f6f9fc",
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e6ebf1',
};

const credentialItem = {
    margin: "10px 0",
    color: "#525f7f",
    fontSize: "16px",
    lineHeight: "24px",
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
