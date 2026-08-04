# Product Requirements

Status labels used in this document: **Confirmed**, **Partial**, **Missing**, **Planned**, **Unverified**.

## Confirmed owner decisions

- **Confirmed:** FreshMooz will launch with verified online payments.
- **Confirmed:** Razorpay is the selected payment provider.
- **Confirmed:** The initial market is India.
- **Confirmed:** The primary currency is INR.
- **Confirmed:** Intended payment methods are UPI, cards, supported wallets, and international cards where enabled by Razorpay.
- **Confirmed:** Manual client-supplied payment amounts or payment methods must not mark public orders as paid.
- **Confirmed:** Guest checkout remains the intended direction for one-time purchases.
- **Confirmed:** Product subscriptions remain planned for a later phase.

## 1. Confirmed existing capabilities

### Storefront

- **Confirmed:** Customer storefront exists in `frontend/freshmooz-web`.
- **Confirmed:** Homepage, catalogue, product detail, cart, checkout, login, register, reset password, orders, and order success pages exist.
- **Confirmed:** Cart uses browser `localStorage`.
- **Confirmed:** Storefront fetches products from the API.
- **Confirmed:** Add-to-cart updates the local cart.
- **Partial:** Checkout can submit guest order data, but confirmation and order detail lookup are incomplete.

### Backend commerce

- **Confirmed:** Products can be listed publicly.
- **Confirmed:** Admin product create/update/archive/restore/delete paths exist.
- **Confirmed:** Orders can be created with one or multiple items.
- **Confirmed:** Order creation creates an unpaid invoice automatically.
- **Confirmed:** Order creation deducts inventory.
- **Confirmed:** Order cancellation restores inventory.
- **Confirmed:** Clients and addresses exist.
- **Confirmed:** Manual invoice/payment records exist.
- **Confirmed:** Client credit/advance ledger exists.
- **Confirmed:** Admin inventory adjustments and transaction history exist.

### Authentication and admin

- **Confirmed:** ASP.NET Identity registration/login/password reset exists.
- **Confirmed:** JWT auth exists.
- **Confirmed:** Admin/User role model exists.
- **Confirmed:** Admin panel supports dashboard, products, orders, invoices, inventory, clients, and analytics.
- **Partial:** Roles are coarse-grained. Fine-grained permissions are missing.

## 2. Required FreshMooz launch capabilities

### Storefront launch

- **Confirmed:** Product browsing must continue to work.
- **Confirmed:** Product details must remain available.
- **Confirmed:** Cart must preserve quantity changes and remove items correctly.
- **Required:** Checkout must support guest checkout for one-time orders.
- **Required:** Authenticated checkout must be optional.
- **Required:** Account creation must not be required for one-time orders.
- **Required:** Confirmation page must display the correct order identifier.
- **Required:** Guest users must receive a safe confirmation experience without exposing other orders.
- **Required:** Product prices used for orders must come from the server, not from client-supplied values.
- **Required:** Duplicate order submissions must be prevented.
- **Required:** Stock must not be oversold under normal concurrent checkout conditions.

### Payment launch

- **Partial:** Current payment methods represent manual/internal labels: Cash, UPI, Cheque.
- **Missing:** Razorpay integration.
- **Missing:** Razorpay webhook handling.
- **Required:** Launch must integrate Razorpay verified online payments before claiming online payment completion.
- **Required:** Backend must create Razorpay Orders from a server-calculated FreshMooz order total.
- **Required:** Amounts must use INR and be converted safely to Razorpay paise values server-side.
- **Required:** Backend must verify Razorpay Checkout payment signatures before marking payments/orders paid.
- **Required:** Webhook handling must be idempotent.
- **Required:** Payment reconciliation must be supported so FreshMooz order/payment status can be compared against Razorpay.
- **Required:** Checkout must handle payment success, failure, cancellation, and retry states.
- **Required:** Order confirmation must appear only after valid FreshMooz order creation; paid status must depend on verified Razorpay payment.
- **Required:** Public checkout must not allow clients to mark orders paid.
- **Planned:** Razorpay Subscriptions are future work and are not part of the initial one-time purchase implementation.

### Email and communication

- **Partial:** Password reset/contact email support exists.
- **Missing:** Order confirmation email.
- **Required:** Decide whether order confirmation email is required for FreshMooz launch.

### Security launch

- **Required:** Remove or rotate committed secrets.
- **Required:** Public checkout must ignore/reject client-supplied unit prices, discounts, and payment amounts.
- **Required:** Tenant handling for public FreshMooz checkout must be explicit and safe.
- **Required:** Production CORS and environment values must be verified.

### Admin launch

- **Confirmed:** Admin product, order, invoice, inventory, and client management exist.
- **Required:** Admin must be able to see new storefront orders.
- **Required:** Admin must be able to record manual payments safely.
- **Required:** Admin must be able to cancel orders and restore inventory.

## 3. Planned reusable platform modules

- **Planned:** Store/tenant resolver for multiple stores.
- **Planned:** Shared product catalogue module.
- **Planned:** Backend category module.
- **Planned:** Backend product variants/options module.
- **Planned:** Shared pricing module with clear public/admin boundaries.
- **Planned:** Checkout module with guest and authenticated flows.
- **Planned:** Payment module with provider abstraction and webhooks.
- **Planned:** Notification/email module.
- **Planned:** Promotion/coupon module.
- **Planned:** Reporting module.
- **Planned:** Audit logging module.
- **Planned:** Feature flag module.
- **Planned:** Shared storefront component package.
- **Planned:** Shared admin component/package structure.
- **Planned:** Product subscriptions.

Product subscriptions are planned only. They are not implemented and should not be required for one-time FreshMooz launch checkout.
Razorpay Subscriptions are also future work. The initial Razorpay implementation is for one-time purchases only.

## 4. Future ideas

- **Future idea:** Saved payment methods.
- **Future idea:** Recurring product subscriptions.
- **Future idea:** Delivery scheduling.
- **Future idea:** Promotion campaigns.
- **Future idea:** Advanced search and filters.
- **Future idea:** Multi-warehouse inventory.
- **Future idea:** Store-specific themes.
- **Future idea:** Customer loyalty features.
- **Future idea:** Low-stock alerts.
- **Future idea:** Operational dashboards for fulfillment.

## MVP checkout requirement

- **Planned:** Guest checkout for one-time orders.
- **Planned:** Optional authenticated checkout for saved profile/address and order history.
- **Planned:** Account requirement only for future subscriptions.
- **Missing:** Idempotency key and duplicate submission protection.
- **Missing:** Secure guest order lookup token.
- **Missing:** Razorpay one-time payment integration.
