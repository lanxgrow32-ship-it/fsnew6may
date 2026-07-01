
# FundedStock External Gateway Integration Guide (v1.0)
**Core App Domain**: `app.fundedstock.io`  
**Portal Domain**: `fundedstock.shop`

---

## 1. Validation Protocol
When a trader enters their Wallet ID on `fundedstock.shop`, you must validate it before proceeding to payment.

**Endpoint**: `GET https://app.fundedstock.io/api/external/wallet/validate?wallet_id={ID}`

**Response (Success)**:
```json
{
  "valid": true,
  "name": "Trader Name",
  "email": "trader@example.com"
}
```

---

## 2. Credit Notification (Post-Payment)
Once the Razorpay/Gateway payment is confirmed on your end, notify the core app to credit the wallet.

**Endpoint**: `POST https://app.fundedstock.io/api/external/wallet/credit`

**Headers**:
- `Content-Type: application/json`

**Body Payload**:
```json
{
  "wallet_id": 12345678,
  "amount": 10000,
  "transaction_id": "PAYID_XYZ_123",
  "secret_key": "YOUR_SHARED_SECRET_KEY"
}
```

---

## 3. Business Logic & Rules
The core app (`app.fundedstock.io`) will handle the following automatically upon receiving your signal:

1.  **Bonus Check**: If `amount` >= 10,000, the system adds a 5% bonus to the trader's balance.
2.  **Audit Trail**: A "Portal Top-up" transaction is logged.
3.  **Communication**: The trader receives a "Wallet Success" email confirmation via Make.com.

---

## 4. Required from You (Developer)
1.  **Secret Key**: Define a strong `FS_GATEWAY_SECRET` and provide it to the Core App admin to add to their `.env`.
2.  **Security**: Ensure your POST call uses HTTPS and passes the correct `secret_key`.
3.  **UX**: Redirect the user back to `https://app.fundedstock.io/welcome?tab=wallet` after successful payment.
