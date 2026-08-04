# Launch Checklist

Status labels used in this checklist: **Confirmed**, **Partial**, **Missing**, **Planned**, **Unverified**.

## Storefront

- [ ] **Confirmed:** Homepage loads correctly on desktop and mobile.
- [ ] **Confirmed:** Header navigation links work.
- [ ] **Confirmed:** Footer links use real routes only.
- [ ] **Unverified:** Production storefront URL is configured correctly.
- [ ] **Unverified:** Browser console has no launch-blocking errors.
- [ ] **Unverified:** Accessibility basics are checked for keyboard focus, contrast, and labels.

## Catalogue

- [ ] **Confirmed:** Product grid fetches products from `GET /api/Products`.
- [ ] **Confirmed:** Product cards show name, price, size/description where available, image, stock/action state.
- [ ] **Partial:** Categories are storefront/UI-level; backend category model is not confirmed.
- [ ] **Unverified:** Empty catalogue state is acceptable.
- [ ] **Unverified:** Out-of-stock product behavior is correct.

## Product details

- [ ] **Confirmed:** Product detail route exists.
- [ ] **Partial:** Product lookup is slug-derived from product list rather than a dedicated backend slug endpoint.
- [ ] **Unverified:** Product image fallback works for all production products.
- [ ] **Unverified:** Product details contain enough purchase information for launch.

## Cart

- [ ] **Confirmed:** Add to cart stores items in localStorage.
- [ ] **Confirmed:** Cart quantity increase/decrease works locally.
- [ ] **Confirmed:** Remove item works locally.
- [ ] **Partial:** Cart pricing can call server pricing manually/on checkout.
- [ ] **Missing:** Backend persistent cart.
- [ ] **Unverified:** Cart survives refresh on target browsers.

## Checkout

- [ ] **Confirmed:** Checkout page exists.
- [ ] **Confirmed:** Guest checkout UI exists.
- [ ] **Confirmed:** `POST /api/Orders/price` is anonymous.
- [ ] **Confirmed:** `POST /api/Orders` is anonymous.
- [ ] **Confirmed:** Backend creates client, address, order, order items, invoice, and inventory transaction for multi-line checkout.
- [ ] **Partial:** Confirmation redirect currently expects `orderId`/`OrderId`, but backend returns `Id`.
- [ ] **Partial:** Guest order detail lookup is not reliable.
- [ ] **Missing:** Idempotency key / duplicate submission protection.
- [ ] **Missing:** Secure guest order lookup token.
- [ ] **Missing:** Confirmed concurrency-safe inventory deduction.
- [ ] **Required:** Public checkout must ignore or reject client-supplied `UnitPrice`.
- [ ] **Required:** Public checkout must ignore or reject client-supplied `DiscountAmount`.
- [ ] **Required:** Public checkout must ignore or reject client-supplied `PaymentAmount`.
- [ ] **Required:** Public checkout must not allow a client to mark an order paid.
- [ ] **Required:** Move guest client/address creation into the same transaction boundary as order creation, or verify rollback behavior.

## Payments

- [ ] **Partial:** Manual payment methods exist: Cash, UPI, Cheque.
- [ ] **Partial:** Admin can record payment/invoice records.
- [ ] **Missing:** Real online payment gateway.
- [ ] **Missing:** Payment webhook endpoint.
- [ ] **Missing:** Payment verification before marking order paid.
- [ ] **Required:** Decide whether launch is unpaid/manual payment or online payment.
- [ ] **Required:** Do not claim secure online payment completion unless a real provider flow exists.

## Orders

- [ ] **Confirmed:** Orders are persisted.
- [ ] **Confirmed:** Order items are persisted.
- [ ] **Confirmed:** Order cancellation restores inventory.
- [ ] **Confirmed:** Authenticated `/orders` page exists.
- [ ] **Partial:** Guest order confirmation/details need a safe lookup strategy.
- [ ] **Unverified:** Admin can manage all launch order statuses required by operations.

## Email

- [ ] **Partial:** Password reset/contact email support exists.
- [ ] **Missing:** Order confirmation email.
- [ ] **Unverified:** SMTP production configuration is safe and current.
- [ ] **Required:** Decide whether order confirmation email is required at launch.

## Admin

- [ ] **Confirmed:** Admin login exists.
- [ ] **Confirmed:** Product management exists.
- [ ] **Confirmed:** Order management exists.
- [ ] **Confirmed:** Invoice/payment recording exists.
- [ ] **Confirmed:** Inventory adjustment/history exists.
- [ ] **Confirmed:** Client management exists.
- [ ] **Partial:** Role model is Admin/User only.
- [ ] **Unverified:** Admin registration policy is production-safe.

## Security

- [ ] **Required:** Rotate/remove committed secrets from source configuration.
- [ ] **Required:** Verify production JWT secret is strong and not the placeholder.
- [ ] **Required:** Verify production database credentials are not committed.
- [ ] **Required:** Verify SMTP credentials are not committed and are rotated if exposed.
- [ ] **Required:** Lock public checkout to server-side prices only.
- [ ] **Required:** Block fake public payment completion.
- [ ] **Required:** Add duplicate submission protection.
- [ ] **Partial:** Tenant handling exists but anonymous tenant fallback uses tenant `1`.
- [ ] **Unverified:** Production CORS origins are exactly correct.
- [ ] **Unverified:** Rate limiting / abuse protection.

## Testing

- [ ] **Confirmed:** Backend tests cover selected inventory/order/client/contact/tenant behavior.
- [ ] **Missing:** Guest checkout end-to-end test.
- [ ] **Missing:** Public checkout price tampering test.
- [ ] **Missing:** Public checkout payment tampering test.
- [ ] **Missing:** Duplicate submission/idempotency test.
- [ ] **Missing:** Concurrent stock checkout test.
- [ ] **Missing:** Checkout rollback test for order/invoice/inventory failure.
- [ ] **Missing:** Confirmation page order id test.
- [ ] **Missing:** Frontend automated checkout test.
- [ ] **Unverified:** Current test suite passes in CI/production-like environment.

## Staging

- [ ] **Unverified:** Staging API exists.
- [ ] **Unverified:** Staging storefront exists.
- [ ] **Unverified:** Staging admin exists.
- [ ] **Unverified:** Staging database seed data is safe and representative.
- [ ] **Unverified:** Production secrets are not used in staging unless intentionally configured.

## Deployment

- [ ] **Partial:** API deployment artifacts exist under `.deploy`.
- [ ] **Unverified:** Current production deployment process is the source of truth.
- [ ] **Unverified:** Frontend deployment process is documented/verified.
- [ ] **Unverified:** Database migration process is documented/verified.
- [ ] **Unverified:** Environment variables are set correctly in production.
- [ ] **Required:** Run production build/checks before launch.

## Monitoring

- [ ] **Missing:** Confirmed production error monitoring.
- [ ] **Missing:** Confirmed uptime monitoring.
- [ ] **Missing:** Confirmed checkout/order failure alerting.
- [ ] **Missing:** Confirmed payment failure alerting if online payment is added.
- [ ] **Unverified:** Server logs are retained and accessible.

## Backups

- [ ] **Unverified:** PostgreSQL backups exist.
- [ ] **Unverified:** Backup schedule exists.
- [ ] **Unverified:** Restore process has been tested.
- [ ] **Unverified:** Backup retention policy exists.

## Rollback

- [ ] **Unverified:** API rollback process exists.
- [ ] **Unverified:** Storefront rollback process exists.
- [ ] **Unverified:** Admin rollback process exists.
- [ ] **Unverified:** Database migration rollback plan exists.
- [ ] **Required:** Define launch rollback owner and trigger conditions.
