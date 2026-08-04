# FreshMooz API capabilities

Status labels: **Working**, **Partial**, **Missing**, **Broken**, **Legacy**, **Unverified**.

FreshMooz is the only active store for the current phase. Existing tenant fields remain relevant, but strict multi-store hardening is deferred. Public FreshMooz requests should use a server-controlled FreshMooz tenant context rather than accepting arbitrary tenant selection.

## Confirmed payment decisions

- **Confirmed decision:** FreshMooz will launch with verified online payments.
- **Confirmed decision:** Razorpay is the selected payment provider.
- **Confirmed decision:** The initial market is India.
- **Confirmed decision:** The primary currency is INR.
- **Confirmed decision:** Intended payment methods are UPI, cards, supported wallets, and international cards where enabled by Razorpay.
- **Confirmed decision:** Manual client-supplied payment amounts or payment methods must not mark public orders as paid.
- **Confirmed decision:** Guest checkout remains the intended direction for one-time purchases.
- **Confirmed decision:** Product subscriptions remain planned for a later phase.

## Launch blockers confirmed by the API audit

| Blocker | Status | Notes |
|---|---:|---|
| Public registration accepts `Role` and `TenantId` | Broken | `POST /api/Auth/register` can create caller-requested roles, including `Admin`, and accepts caller-provided tenant selection. |
| Public pricing accepts `UnitPrice` and `DiscountAmount` | Broken | `POST /api/Orders/price` maps these fields into pricing and uses them when present. |
| Public checkout accepts payment, credit, status, date, price, and discount fields | Broken | `POST /api/Orders` uses `MultiOrderRequest`, which exposes admin/server-controlled fields to anonymous callers. |
| No checkout idempotency | Missing | Repeated submissions can create duplicate orders, invoices, and stock movements. |
| No concurrency-safe stock deduction | Partial | Stock is checked and deducted, but no row-version, lock, or atomic conditional update was confirmed. |
| Guest checkout route/auth mismatch | Broken | Backend allows anonymous order creation, but storefront route protection blocks `/checkout` and `/order/*` for guests. |
| Order confirmation response mismatch | Broken | Storefront expects `orderId`/`OrderId`; backend returns `Id`. |
| Incorrect order-detail API path | Broken | Storefront helper calls `/orders/{id}` while backend exposes `/api/Orders/{id}`. |
| No safe guest order lookup | Missing | `GET /api/Orders/{id}` requires JWT; no tokenized guest lookup endpoint exists. |
| No verified Razorpay online payment flow | Missing | Current payment/invoice records are manual/unverified; no Razorpay Order creation, payment signature verification, webhook handling, or reconciliation flow was found. |

## Authentication and authorization

**Status:** Partial

**Main endpoints**

- `POST /api/Auth/register`
- `POST /api/Auth/login`
- `POST /api/Auth/forgot-password`
- `POST /api/Auth/reset-password`
- `POST /api/Auth/logout`

**Authentication requirement:** Public.

**Storefront/admin usage:** Both `freshmooz-web` and `freshmooz-admin` use login/register/reset helpers.

**Known issues**

- Public registration accepts `Role` and `TenantId`.
- Logout is stateless JWT client cleanup only; no token revocation was confirmed.
- Password reset has a TODO for rate limiting.
- Swagger does not configure Bearer token authorization UI.

**Known contract mismatches:** None confirmed for login/reset response use.

**FreshMooz launch relevance:** Launch blocker until public registration cannot create admin users or select arbitrary tenant IDs.

## Products

**Status:** Partial

**Main endpoints**

- `GET /api/Products?includeInactive=false`
- `GET /api/Products/{id}`
- `POST /api/Products`
- `PUT /api/Products/{id}`
- `PUT /api/Products/{id}/archive`
- `PUT /api/Products/{id}/restore`
- `DELETE /api/Products/{id}`

**Authentication requirement:** Public read. Admin JWT required for create/update/archive/restore/delete.

**Storefront/admin usage:** Storefront lists products. Admin manages products.

**Known issues**

- Product API returns domain model directly.
- No category, variant, slug, or media-management contract.
- `includeInactive` only works when an admin JWT is present.

**Known contract mismatches**

- Storefront product detail uses local/static slug data, while API detail supports numeric IDs only.

**FreshMooz launch relevance:** Product list is usable. Dynamic categories, variants, and slug-backed details are not complete.

## Categories

**Status:** Missing

**Main endpoints:** None confirmed.

**Authentication requirement:** Not applicable.

**Storefront/admin usage:** Storefront category presentation appears static or derived from product data.

**Known issues:** No category entity/controller/API contract was confirmed.

**Known contract mismatches:** Category UI exists without a backend category source of truth.

**FreshMooz launch relevance:** Not a blocker if categories remain static for launch. Required if owners expect admin-managed categories.

## Product details

**Status:** Partial

**Main endpoints**

- `GET /api/Products/{id}`

**Authentication requirement:** Public.

**Storefront/admin usage:** Admin edit uses numeric product lookup. Storefront product pages use local slug data.

**Known issues:** No API slug lookup.

**Known contract mismatches:** Storefront routes are slug-based; API routes are ID-based.

**FreshMooz launch relevance:** Confirm whether static product detail pages are acceptable for launch.

## Inventory

**Status:** Partial

**Main endpoints**

- `GET /api/admin/inventory`
- `POST /api/admin/inventory/adjust`
- `GET /api/admin/inventory/transactions`

**Authentication requirement:** Admin JWT.

**Storefront/admin usage:** Admin inventory pages use these endpoints. Checkout uses inventory services indirectly during order creation.

**Known issues**

- Manual adjustments exist.
- Checkout stock validation and deduction exist.
- No concurrency-safe stock deduction was confirmed.

**Known contract mismatches:** None confirmed in admin inventory pages.

**FreshMooz launch relevance:** Launch blocker until stock deduction is made safe under concurrent checkout.

## Customers and addresses

**Status:** Partial

**Main endpoints**

- `GET /api/Clients`
- `GET /api/Clients/{id}`
- `POST /api/Clients`
- `PUT /api/Clients/{id}`
- `DELETE /api/Clients/{id}`
- `PUT /api/Clients/{id}/restore`
- `GET /api/Clients/me`
- `POST /api/Clients/me`
- `GET /api/Clients/addresses`
- `POST /api/Clients/addresses`
- `PUT /api/Clients/addresses/{id}`
- `DELETE /api/Clients/addresses/{id}`
- `GET /api/Clients/{clientId}/addresses`
- `POST /api/Clients/{clientId}/addresses`
- `PUT /api/Clients/{clientId}/addresses/{id}`
- `DELETE /api/Clients/{clientId}/addresses/{id}`

**Authentication requirement:** Admin JWT for admin client routes. Authenticated user JWT for `/me` and own address routes.

**Storefront/admin usage:** Storefront profile/checkout uses current-user profile and saved addresses. Admin manages clients and addresses.

**Known issues**

- Direct domain entities are returned for several client/address endpoints.
- Guest checkout can create/find clients by email during order creation, but guest users cannot safely retrieve orders afterward.

**Known contract mismatches:** Guest customer flow is split between anonymous order creation and authenticated customer endpoints.

**FreshMooz launch relevance:** Authenticated account flow is partially usable. Guest checkout confirmation remains missing.

## Cart pricing

**Status:** Broken

**Main endpoints**

- `POST /api/Orders/price`

**Authentication requirement:** Public.

**Storefront/admin usage:** Storefront cart and checkout use this endpoint. Admin new-order flow also uses it.

**Known issues**

- Public request model accepts `UnitPrice` and `DiscountAmount`.
- Server pricing service uses those supplied values when present.
- Stock availability is checked, but concurrency safety is not guaranteed.

**Known contract mismatches**

- Storefront references tax-like totals in places, but `CartPriceViewModel` returns `subtotal`, `discountTotal`, `total`, and `items`; no tax model was confirmed.

**FreshMooz launch relevance:** Launch blocker. Public pricing must only accept product IDs and quantities.

## Checkout and order creation

**Status:** Broken

**Main endpoints**

- `POST /api/Orders`

**Authentication requirement:** Public.

**Storefront/admin usage:** Storefront checkout and admin new-order flow both use this endpoint.

**Known issues**

- Public model accepts `PaymentMethod`, `PaymentAmount`, `ApplyCreditAmount`, `InitialOrderStatus`, `OrderDate`, `UnitPrice`, and `DiscountAmount`.
- Anonymous callers can submit values that should be server/admin-controlled.
- Initial payment creates paid invoice records without verified payment integration.
- No idempotency key or duplicate-submission protection.
- Stock deduction lacks confirmed concurrency safety.
- Admin and storefront order creation are not separated.

**Known contract mismatches**

- Backend returns `Id`; storefront success flow expects `orderId`/`OrderId`.
- Backend maps billing address from shipping address; separate billing behavior is not fully implemented.

**FreshMooz launch relevance:** Launch blocker.

## Guest order confirmation

**Status:** Broken / Missing

**Main endpoints:** None confirmed for safe guest lookup.

**Authentication requirement:** Current order lookup requires JWT through `GET /api/Orders/{id}`.

**Storefront/admin usage:** Storefront order success and order detail pages expect an order confirmation path.

**Known issues**

- No tokenized or email-verified guest lookup endpoint.
- Storefront protects `/checkout` and `/order/*`, conflicting with guest checkout.
- Storefront order detail helper uses an incorrect API path.

**Known contract mismatches**

- `GET /api/Orders/{id}` exists, but the storefront helper calls `/orders/{id}`.
- Success page can show a fallback order ID instead of the backend order ID.

**FreshMooz launch relevance:** Launch blocker if guest checkout is required.

## Orders and order history

**Status:** Partial

**Main endpoints**

- `GET /api/Orders`
- `GET /api/Orders/{id}`
- `PUT /api/Orders/{id}`
- `PUT /api/Orders/{id}/status`
- `DELETE /api/Orders/{id}`
- `GET /api/admin/orders`
- `PUT /api/admin/orders/{id}/status`
- `GET /api/admin/orders/{orderId}/adjustments`
- `POST /api/admin/orders/{orderId}/adjustments`

**Authentication requirement:** JWT for `/api/Orders`; admin JWT for `/api/admin/orders*`.

**Storefront/admin usage:** Storefront order history uses `GET /api/Orders`. Admin order list/detail/status/adjustments use admin endpoints plus order detail.

**Known issues**

- General order mutation routes are authenticated but not clearly admin-only at the controller level.
- Delete currently conflicts because orders affect inventory/invoicing.
- Guest lookup is missing.

**Known contract mismatches:** Storefront order detail path and auth behavior do not match backend.

**FreshMooz launch relevance:** Authenticated history is partially usable. Guest confirmation is not.

## Invoices and payments

**Status:** Partial

**Main endpoints**

- `GET /api/Invoices`
- `GET /api/Invoices/{id}`
- `POST /api/Invoices`
- `DELETE /api/Invoices/{id}`
- `GET /api/Invoices/order/{orderId}`
- `GET /api/admin/invoices`
- `POST /api/admin/invoices`

**Authentication requirement:** JWT for `/api/Invoices`; admin JWT for invoice creation/deletion and `/api/admin/invoices`.

**Storefront/admin usage:** Admin invoice pages and order creation use invoice endpoints. No storefront payment verification flow was confirmed.

**Known issues**

- Manual invoice/payment records exist.
- No verified Razorpay online payment integration.
- Public checkout can currently submit payment fields through order creation.
- `/api/Invoices` and `/api/admin/invoices` overlap.
- Current manual invoice/payment behavior is insufficient for public verified payment.
- Razorpay secret keys must remain entirely server-side and must not be exposed to the storefront.

**Known contract mismatches:** Invoice/payment semantics are mixed: unpaid order invoice, paid payment rows, and manual admin invoices.

**FreshMooz launch relevance:** Manual payment/order tracking may be usable for admin records only. Public launch requires verified Razorpay payment processing.

### Razorpay payment capabilities required for launch

**Status:** Missing

**Confirmed decision**

- Razorpay is the selected FreshMooz payment provider for one-time launch checkout.
- India is the initial market.
- INR is the primary currency.
- UPI, cards, supported wallets, and international cards where enabled by Razorpay are intended payment methods.

**Current implementation**

- Existing API has manual invoice/payment records.
- Existing public checkout can accept payment-related fields from the client.
- No Razorpay Order creation endpoint was confirmed.
- No Razorpay Checkout signature verification endpoint was confirmed.
- No Razorpay webhook endpoint was confirmed.
- No payment reconciliation endpoint/process was confirmed.

**Required for launch**

- Create a Razorpay Order from a server-calculated FreshMooz order total.
- Convert INR amounts to paise server-side.
- Persist the FreshMooz order-to-Razorpay-order mapping.
- Verify Razorpay Checkout payment signature on the server.
- Receive Razorpay webhooks.
- Verify Razorpay webhook signatures.
- Persist payment records separately from invoice documents.
- Retrieve payment status for reconciliation.
- Prevent duplicate payment processing through idempotent webhook/event handling.
- Process captured/paid events only after verification.
- Handle payment success, failure, cancellation, and retry.
- Expose a safe payment/order result to the storefront.
- Keep Razorpay secret keys entirely server-side.
- Ensure manual client-supplied payment amounts or payment methods cannot mark public orders as paid.

**Future subscription work**

- Razorpay Subscriptions remain planned for a later phase.
- Subscription plans, recurring billing, saved mandate/payment setup, renewal attempts, and subscription-specific webhook handling are not part of the initial one-time purchase implementation.

## Admin products

**Status:** Partial

**Main endpoints**

- `GET /api/Products?includeInactive=true`
- `GET /api/Products/{id}`
- `POST /api/Products`
- `PUT /api/Products/{id}`
- `PUT /api/Products/{id}/archive`
- `PUT /api/Products/{id}/restore`
- `DELETE /api/Products/{id}`

**Authentication requirement:** Admin JWT for write actions and inactive product visibility.

**Storefront/admin usage:** Active admin product management.

**Known issues:** No categories, variants, image upload, or separate admin product DTO.

**Known contract mismatches:** None confirmed for basic admin CRUD.

**FreshMooz launch relevance:** Usable for simple product management.

## Admin orders

**Status:** Partial

**Main endpoints**

- `GET /api/admin/orders`
- `PUT /api/admin/orders/{id}/status`
- `GET /api/Orders/{id}`
- `POST /api/Orders`
- `POST /api/Orders/price`
- `GET /api/admin/orders/{orderId}/adjustments`
- `POST /api/admin/orders/{orderId}/adjustments`

**Authentication requirement:** Admin JWT for admin endpoints. `POST /api/Orders` and `/price` are public but admin also uses them with JWT.

**Storefront/admin usage:** Active admin order management.

**Known issues:** Admin creation reuses public checkout/pricing endpoints instead of admin-only contracts.

**Known contract mismatches:** Admin can pass fields that storefront must not be able to pass.

**FreshMooz launch relevance:** Admin order management is usable but should be separated from public checkout before launch.

## Admin inventory

**Status:** Partial

**Main endpoints**

- `GET /api/admin/inventory`
- `POST /api/admin/inventory/adjust`
- `GET /api/admin/inventory/transactions`

**Authentication requirement:** Admin JWT.

**Storefront/admin usage:** Active admin inventory pages.

**Known issues:** No confirmed concurrency token/locking for stock.

**Known contract mismatches:** None confirmed.

**FreshMooz launch relevance:** Admin inventory is usable; checkout stock safety needs hardening.

## Admin customers

**Status:** Partial

**Main endpoints**

- `GET /api/Clients`
- `GET /api/Clients/{id}`
- `POST /api/Clients`
- `PUT /api/Clients/{id}`
- `DELETE /api/Clients/{id}`
- `PUT /api/Clients/{id}/restore`
- `GET /api/Clients/{clientId}/addresses`
- `POST /api/Clients/{clientId}/addresses`
- `PUT /api/Clients/{clientId}/addresses/{id}`
- `DELETE /api/Clients/{clientId}/addresses/{id}`
- `GET /api/admin/clients/credit-balances`
- `GET /api/admin/clients/{clientId}/credit-balance`
- `GET /api/admin/clients/{clientId}/credit-ledger`
- `POST /api/admin/clients/{clientId}/advance-payments`

**Authentication requirement:** Admin JWT.

**Storefront/admin usage:** Active admin customer and credit tools.

**Known issues:** Manual credit and advance-payment model needs owner policy confirmation.

**Known contract mismatches:** None confirmed for basic admin use.

**FreshMooz launch relevance:** Useful for admin operations; public checkout must not be allowed to apply arbitrary customer credit.

## Reporting and analytics

**Status:** Partial

**Main endpoints**

- `GET /api/admin/dashboard`
- `GET /api/admin/analytics/monthly/{year}`
- `GET /api/admin/analytics/total`
- Legacy `/api/Sales/*` reporting endpoints

**Authentication requirement:** Admin JWT.

**Storefront/admin usage:** Admin dashboard and charts.

**Known issues:** Reporting concepts are split between current Orders/Invoices and legacy Sales.

**Known contract mismatches:** Revenue semantics need confirmation once payment/invoice model is finalized.

**FreshMooz launch relevance:** Basic admin visibility exists. Financial reporting should be treated as partial.

## Product images

**Status:** Partial

**Main endpoints:** No image upload/media endpoint confirmed.

**Authentication requirement:** Product `ImageFileName` is managed through product create/update.

**Storefront/admin usage:** Storefront resolves image file names/paths. Admin can edit product fields.

**Known issues:** No file upload, media validation, image transformation, or asset lifecycle endpoint.

**Known contract mismatches:** Image handling depends on existing project assets and filename conventions.

**FreshMooz launch relevance:** Acceptable if images are managed manually in project assets. Not sufficient for full reusable ecommerce admin media management.

## Email and notifications

**Status:** Partial

**Main endpoints**

- `POST /api/Auth/forgot-password`
- `POST /contact`

**Authentication requirement:** Public.

**Storefront/admin usage:** Password reset and contact form.

**Known issues**

- No order confirmation email endpoint/service flow confirmed.
- Email sender falls back to no-op when SMTP is not configured.
- Contact endpoint is SmartSofto-oriented, not a FreshMooz order-notification endpoint.

**Known contract mismatches:** None confirmed for password reset.

**FreshMooz launch relevance:** Order notification capability is missing/unverified.

## Health and operational endpoints

**Status:** Missing / Partial

**Main endpoints**

- `GET /`
- `GET /Home`

**Authentication requirement:** Public.

**Storefront/admin usage:** Operational/manual only.

**Known issues**

- No health, readiness, or liveness endpoint was found.
- Root redirects to `/swagger` even when Swagger may be disabled.
- Swagger is conditionally enabled but lacks Bearer auth configuration.

**Known contract mismatches:** Production root may redirect to a disabled Swagger route.

**FreshMooz launch relevance:** Health/readiness should be added before production monitoring is considered complete.

## Legacy Sales, Plants, and User APIs

**Status:** Legacy / Unverified

**Main endpoints**

- `/api/Sales`
- `/api/Sales/{id}`
- `/api/Sales/invoice/{invoiceNumber}`
- `/api/Sales/client/{clientId}`
- `/api/Sales/daterange`
- `/api/Sales/{id}/payment`
- `/api/Sales/{id}/status`
- `/api/Sales/overdue`
- `/api/Sales/total`
- `/api/Sales/client/{clientId}/total`
- `/api/Sales/monthly/{year}`
- `/api/Sales/monthly/{year}/by-product`
- `/api/Sales/monthly/{year}/by-client`
- `/api/Sales/analysis/{year}`
- `/api/Plants`
- `/api/Plants/{id}`
- `/api/User`
- `/api/User/{id}`

**Authentication requirement:** Admin JWT.

**Storefront/admin usage:** Not confirmed as FreshMooz source-of-truth routes.

**Known issues**

- Sales duplicates current Orders/Invoices concepts.
- Plants are not confirmed as relevant to FreshMooz launch.
- User API is separate from customer/client profile APIs.

**Known contract mismatches:** Source-of-truth boundaries are unclear.

**FreshMooz launch relevance:** These routes are not approved as FreshMooz source-of-truth routes unless owners explicitly decide otherwise.
