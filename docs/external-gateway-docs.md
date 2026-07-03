
# FundedStock External Gateway Integration Guide (v1.2)
**Core App Domain**: `app.fundedstock.io`  
**Portal Domain**: `fundedstock.shop`

---

## 1. Deep Link Implementation
Traders will be sent from the core app directly to your verification page.
**URL Format**: `https://www.fundedstock.shop/topup?wallet_id={ID}`

---

## 2. Step 1: Wallet Validation (The "Green Mark" Phase)
When the page loads or a trader enters their Wallet ID, you must validate it against the core database. On success, you should display the Trader's Name with a green verification mark.

**Endpoint**: `GET https://app.fundedstock.io/api/external/wallet/validate?wallet_id={ID}`

**CORS Policy**: Whitelisted for `https://www.fundedstock.shop`. You can make this call via client-side `fetch`.

**Response (Success - 200 OK)**:
```json
{
  "valid": true,
  "name": "John Doe",
  "email": "john@example.com"
}
```

---

## 3. Step 2: Payment Processing
You are responsible for integrating the **Cashfree Payment Gateway** on `fundedstock.shop`. 
- Collect the validated `wallet_id`.
- Process the payment (INR).

---

## 4. Step 3: Credit Notification (Post-Payment)
Once Cashfree confirms the payment is successful on your end, notify the core app to credit the wallet.

**Endpoint**: `POST https://app.fundedstock.io/api/external/wallet/credit`

**Headers**:
- `Content-Type: application/json`

**Body Payload**:
```json
{
  "wallet_id": 12345678,
  "amount": 10000,
  "transaction_id": "CASHFREE_ORDER_ID_999",
  "secret_key": "YOUR_SHARED_SECRET_KEY"
}
```

---

## 5. Success Handoff & Redirection
1. **Secret Key**: You must use the `FS_GATEWAY_SECRET` provided by the admin in the `secret_key` field of your POST call.
2. **Success Redirect**: After the POST call is successful and you receive a `200 OK` from the Credit API, redirect the user back to:  
   `https://app.fundedstock.io/welcome?tab=wallet`

---

## 6. Business Logic (Handled by Core App)
The core app will automatically:
1. **Apply Bonus**: If `amount` >= 10,000, a **5% Loyalty Bonus** is added.
2. **Audit Trail**: Logs a "Portal Top-up" transaction.
3. **Notify**: Sends a "Wallet Success" email via Make.com.
4. **Instant Update**: The trader's balance updates in their dashboard immediately.
