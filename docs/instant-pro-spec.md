
# FundedStock "Instant Pro" Category Specification (v1.1)
**Core Spec for StockMint Engine Synchronization**

## 1. Overview
The "Instant Pro" category is a high-intensity account series designed for weekly execution targets. It bypasses evaluation phases but imposes strict validity deadlines and liquidity hurdles.

## 2. Business Logic (App Router Level)
- **Validity**: Exactly 7 Calendar Days from the timestamp of activation.
- **Expiry Signal**: At `now() >= expires_at`, the portal triggers `POST /api/users/delete` to the Hub and updates the local state to `status: 'deleted'`.
- **Market Segment**: Indian Market (NSE/BSE) and Forex Arena support.

## 3. StockMint Hub Handshake (API v3.0)
When provisioning an Instant Pro account, the following payload is sent to `https://stockmint.io/api/users/create`:

```json
{
  "fullName": "TRADER_NAME",
  "email": "GENERATED_USERNAME",
  "password": "GENERATED_PASSWORD",
  "initialBalance": 500000,
  "accountClassification": "instant_pro",
  "accountModel": "normal",
  "marketType": "indian"
}
```

## 4. Withdrawal Protocol (Enforced by Compliance)
The system calculates a "Liquidity Hurdle" for all Pro accounts. Payouts are rejected if `currentBalance < (initialBalance * 1.5)`.

- **5L Pro**: Min balance 7.5L for withdrawal.
- **10L Pro**: Min balance 15L for withdrawal.
- **15L Pro**: Min balance 22.5L for withdrawal.
- **25L Pro**: Min balance 37.5L for withdrawal.
- **50L Pro**: Min balance 75L for withdrawal.

## 5. UI Placement
Featured as an outlined featured section above standard tabs in the "Get Funded" arena to drive high-tier conversions.
