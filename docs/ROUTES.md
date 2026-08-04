# FreshMooz routes

Status labels: **Working**, **Partial**, **Missing**, **Broken**, **Legacy**, **Unverified**.

`freshmooz-web` is the active FreshMooz storefront. `freshmooz-admin` is the active FreshMooz admin. FreshMooz is the only active store for the current phase; strict multi-store hardening is deferred.

Important route facts:

- Checkout currently conflicts with the guest-checkout intent: the backend allows anonymous order creation, but the storefront route guard protects `/checkout` and `/order/*`.
- Product detail uses local/static slug data in the storefront, while the API supports numeric product IDs.
- Legacy Sales and Plants routes are not approved as FreshMooz source-of-truth routes.
- Do not invent or depend on routes not listed here without confirming them in code.

## Storefront routes

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `/` | FreshMooz homepage | Public | `freshmooz-web` | Working | Uses API product list with local fallback/static storefront data. |
| `/products` | Product catalogue | Public | `freshmooz-web` | Working / Partial | Product data comes from `GET /api/Products`; category/variant presentation is not backed by category/variant APIs. |
| `/product/[slug]` | Product detail page | Public | `freshmooz-web` | Partial | Uses local/static slug data; API only supports `GET /api/Products/{id}`. |
| `/cart` | Cart page | Public | `freshmooz-web` | Partial | Cart is local frontend state; pricing calls `POST /api/Orders/price`, which currently accepts unsafe price/discount fields. |
| `/checkout` | Checkout page | Intended guest/authenticated | `freshmooz-web` | Broken | Storefront auth guard protects checkout, conflicting with guest checkout. Backend `POST /api/Orders` is anonymous but unsafe. |
| `/order/success` | Order confirmation page | Intended guest/authenticated | `freshmooz-web` | Broken | Storefront expects `orderId`; backend returns `Id`. |
| `/order/[id]` | Order detail page | Intended guest/authenticated | `freshmooz-web` | Broken | Helper calls `/orders/{id}`; backend route is `/api/Orders/{id}` and requires JWT. |
| `/orders` | Customer order history | Authenticated | `freshmooz-web` | Partial | Uses `GET /api/Orders`; no guest history. |
| `/login` | Customer login | Public | `freshmooz-web` | Partial | Login works; guest checkout link conflicts with auth guard. |
| `/register` | Customer registration | Public | `freshmooz-web` | Broken | Backend public registration accepts role/tenant fields. |
| `/reset-password` | Password reset | Public | `freshmooz-web` | Partial | Backend reset exists; rate limiting not confirmed. |
| `/profile` | Customer profile/account area | Authenticated | `freshmooz-web` | Partial | Uses `/api/Clients/me` and address endpoints; guest users cannot use saved profile/address features. |

## Authentication routes

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `POST /api/Auth/register` | Register user | Public | Storefront/admin auth | Broken | Accepts `Role` and `TenantId`; can create admin role if requested. |
| `POST /api/Auth/login` | Login and return JWT | Public | Storefront/admin auth | Working | No rate limiting/lockout confirmed. |
| `POST /api/Auth/forgot-password` | Request password reset | Public | Storefront/admin auth | Partial | Rate limiting TODO exists. |
| `POST /api/Auth/reset-password` | Complete password reset | Public | Storefront/admin auth | Working / Partial | Depends on Identity token and email configuration. |
| `POST /api/Auth/logout` | Logout acknowledgement | Public | Storefront/admin auth | Partial | Stateless JWT only; no server-side token revocation confirmed. |

## Customer account routes

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `GET /api/Clients/me` | Current customer profile | JWT | Storefront | Partial | Authenticated only; no guest equivalent. |
| `POST /api/Clients/me` | Create/update current customer profile | JWT | Storefront | Partial | Authenticated only. |
| `GET /api/Clients/addresses` | Current customer addresses | JWT | Storefront | Partial | Authenticated only. |
| `POST /api/Clients/addresses` | Add current customer address | JWT | Storefront | Partial | Authenticated only. |
| `PUT /api/Clients/addresses/{id}` | Update current customer address | JWT | Storefront | Partial | Authenticated only. |
| `DELETE /api/Clients/addresses/{id}` | Delete current customer address | JWT | Storefront | Partial | Authenticated only. |

## Checkout and order routes

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `POST /api/Orders/price` | Price cart/order lines | Public | Storefront checkout/cart, admin new order | Broken | Public request accepts `UnitPrice` and `DiscountAmount`. |
| `POST /api/Orders` | Create order | Public | Storefront checkout, admin new order | Broken | Public request accepts payment, credit, status, date, price, and discount fields. No idempotency. |
| `GET /api/Orders` | List current user's/admin's orders | JWT | Storefront order history, internal/admin | Partial | No guest order history. |
| `GET /api/Orders/{id}` | Order detail | JWT | Admin detail, intended storefront detail | Partial / Broken for guest | Storefront helper uses `/orders/{id}` instead. No safe guest lookup. |
| `PUT /api/Orders/{id}` | Update order | JWT | Internal/unverified | Partial | Not clearly admin-only at controller level. |
| `PUT /api/Orders/{id}/status` | Update order status | JWT | Internal/unverified | Partial | Not clearly admin-only at controller level. |
| `DELETE /api/Orders/{id}` | Delete order | JWT | Internal/unverified | Partial | Service blocks delete because orders affect inventory/invoicing. |

## Admin routes

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `/` | Admin dashboard page | Admin session/JWT in client | `freshmooz-admin` | Partial | Dashboard depends on admin API metrics. |
| `/login` | Admin login page | Public | `freshmooz-admin` | Working | Uses `POST /api/Auth/login`. |
| `/reset-password` | Admin password reset page | Public | `freshmooz-admin` | Partial | Uses auth reset endpoints. |
| `/register` | Admin/user registration page | Public | `freshmooz-admin` | Broken | Backend registration role risk applies. |
| `/products` | Admin product list | Admin | `freshmooz-admin` | Working / Partial | Uses `/api/Products`; no media/categories/variants. |
| `/products/new` | Create product | Admin | `freshmooz-admin` | Partial | Uses direct product payload. |
| `/products/[id]/edit` | Edit product | Admin | `freshmooz-admin` | Partial | Numeric ID route; no slug/category/variant support. |
| `/orders` | Admin order list | Admin | `freshmooz-admin` | Working / Partial | Uses `/api/admin/orders`; status and adjustment workflows exist. |
| `/orders/new` | Admin order creation | Admin | `freshmooz-admin` | Partial | Reuses public `/api/Orders` and `/api/Orders/price` contracts. |
| `/orders/[id]` | Admin order detail | Admin | `freshmooz-admin` | Working / Partial | Uses `GET /api/Orders/{id}` with admin JWT. |
| `/invoices` | Admin invoices | Admin | `freshmooz-admin` | Partial | Uses manual invoice/payment endpoints. |
| `/inventory` | Admin inventory | Admin | `freshmooz-admin` | Working / Partial | Inventory concurrency hardening missing. |
| `/inventory/transactions` | Inventory transaction history | Admin | `freshmooz-admin` | Working | Uses `/api/admin/inventory/transactions`. |
| `/customers` | Admin customers | Admin | `freshmooz-admin` | Partial | Uses client/admin credit endpoints. |

## Backend API routes

### Products

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `GET /api/Products` | Product list | Public | Storefront/admin | Partial | No category/variant/slug contract. |
| `GET /api/Products/{id}` | Product by numeric ID | Public | Admin edit; API consumers | Partial | Storefront detail is slug/static. |
| `POST /api/Products` | Create product | Admin JWT | Admin | Partial | Direct domain model. |
| `PUT /api/Products/{id}` | Update product | Admin JWT | Admin | Partial | Direct domain model. |
| `PUT /api/Products/{id}/archive` | Archive product | Admin JWT | Admin | Working | — |
| `PUT /api/Products/{id}/restore` | Restore product | Admin JWT | Admin | Working | — |
| `DELETE /api/Products/{id}` | Delete product | Admin JWT | Admin | Partial | Conflicts if referenced records exist. |

### Admin operations

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `GET /api/admin/dashboard` | Dashboard metrics | Admin JWT | Admin | Working / Partial | Metric semantics depend on current invoice/order model. |
| `GET /api/admin/orders` | Admin order list | Admin JWT | Admin | Working / Partial | — |
| `PUT /api/admin/orders/{id}/status` | Admin status update | Admin JWT | Admin | Working / Partial | Cancellation adjusts stock. |
| `GET /api/admin/orders/{orderId}/adjustments` | List order adjustments | Admin JWT | Admin | Partial | Adjustment policy needs owner confirmation. |
| `POST /api/admin/orders/{orderId}/adjustments` | Create order adjustment | Admin JWT | Admin | Partial | Adjustment policy needs owner confirmation. |
| `GET /api/admin/invoices` | Admin invoice list | Admin JWT | Admin | Partial | Overlaps `/api/Invoices`. |
| `POST /api/admin/invoices` | Record invoice/payment | Admin JWT | Admin | Partial | Manual/unverified payment record. |
| `GET /api/admin/inventory` | Inventory list | Admin JWT | Admin | Partial | No concurrency token. |
| `POST /api/admin/inventory/adjust` | Manual inventory adjustment | Admin JWT | Admin | Partial | Direct inventory transaction response. |
| `GET /api/admin/inventory/transactions` | Inventory transaction list | Admin JWT | Admin | Working | — |
| `GET /api/admin/clients/credit-balances` | Client credit balances | Admin JWT | Admin | Partial | Manual credit model. |
| `GET /api/admin/clients/{clientId}/credit-balance` | Single credit balance | Admin JWT | Admin | Partial | Manual credit model. |
| `GET /api/admin/clients/{clientId}/credit-ledger` | Credit ledger | Admin JWT | Admin | Partial | Manual credit model. |
| `POST /api/admin/clients/{clientId}/advance-payments` | Record advance payment | Admin JWT | Admin | Partial | Manual/unverified payment record. |
| `GET /api/admin/analytics/monthly/{year}` | Monthly revenue | Admin JWT | Admin | Partial | Revenue definition needs final payment model. |
| `GET /api/admin/analytics/total` | Revenue for date range | Admin JWT | Admin | Partial | Revenue definition needs final payment model. |

### Clients and invoices

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `GET /api/Clients` | Admin client list | Admin JWT | Admin | Partial | Direct domain model. |
| `GET /api/Clients/{id}` | Admin client detail | Admin JWT | Admin | Partial | Direct domain model. |
| `POST /api/Clients` | Create client | Admin JWT | Admin | Partial | Direct domain model. |
| `PUT /api/Clients/{id}` | Update client | Admin JWT | Admin | Partial | Direct domain model. |
| `DELETE /api/Clients/{id}` | Soft delete client | Admin JWT | Admin | Working | — |
| `PUT /api/Clients/{id}/restore` | Restore client | Admin JWT | Admin | Working | — |
| `GET /api/Clients/{clientId}/addresses` | Admin client addresses | Admin JWT | Admin | Partial | — |
| `POST /api/Clients/{clientId}/addresses` | Create client address | Admin JWT | Admin | Partial | — |
| `PUT /api/Clients/{clientId}/addresses/{id}` | Update client address | Admin JWT | Admin | Partial | — |
| `DELETE /api/Clients/{clientId}/addresses/{id}` | Delete client address | Admin JWT | Admin | Partial | — |
| `GET /api/Invoices` | Invoice list | JWT | Admin/user | Partial | Direct domain model. |
| `GET /api/Invoices/{id}` | Invoice detail | JWT | Admin/user | Partial | Direct domain model. |
| `POST /api/Invoices` | Create invoice | Admin JWT | Admin/internal | Partial | Overlaps `/api/admin/invoices`; direct domain model. |
| `DELETE /api/Invoices/{id}` | Delete invoice | Admin JWT | Admin | Partial | Conflict rules apply. |
| `GET /api/Invoices/order/{orderId}` | Invoices for order | JWT | Admin | Partial | No guest access. |

### Email and operational

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `POST /contact` | Contact form email | Public | Storefront/contact forms | Partial | SmartSofto-oriented recipient/content; not order notification. |
| `GET /` | Redirect to Swagger | Public | Browser/ops | Partial | Redirects to `/swagger` even if Swagger disabled. |
| `GET /Home` | Redirect to Swagger | Public | Browser/ops | Partial | Same Swagger dependency. |
| `/swagger` | Swagger UI | Public when enabled | Dev/admin API inspection | Partial | Enabled by config/dev; Bearer auth UI not configured. |
| Health/readiness route | Health check | Not applicable | Ops | Missing | No route confirmed. |

## Legacy or unverified routes

| Route | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| `GET /api/Sales` | Legacy sales list | Admin JWT | Legacy/unverified | Legacy | Not approved as FreshMooz source of truth. |
| `GET /api/Sales/{id}` | Legacy sale detail | Admin JWT | Legacy/unverified | Legacy | Duplicates Orders/Invoices concepts. |
| `GET /api/Sales/invoice/{invoiceNumber}` | Legacy sale by invoice | Admin JWT | Legacy/unverified | Legacy | Duplicates invoice concepts. |
| `GET /api/Sales/client/{clientId}` | Legacy client sales | Admin JWT | Legacy/unverified | Legacy | Duplicates order history concepts. |
| `GET /api/Sales/daterange` | Legacy sales date range | Admin JWT | Legacy/unverified | Legacy | Reporting source-of-truth unclear. |
| `POST /api/Sales` | Create legacy sale | Admin JWT | Legacy/unverified | Legacy | Do not use for FreshMooz order source of truth unless approved. |
| `PUT /api/Sales/{id}` | Update legacy sale | Admin JWT | Legacy/unverified | Legacy | Do not use for FreshMooz order source of truth unless approved. |
| `DELETE /api/Sales/{id}` | Delete legacy sale | Admin JWT | Legacy/unverified | Legacy | Do not use for FreshMooz order source of truth unless approved. |
| `POST /api/Sales/{id}/payment` | Legacy sale payment | Admin JWT | Legacy/unverified | Legacy | Duplicates invoice/payment records. |
| `PUT /api/Sales/{id}/status` | Legacy sale status | Admin JWT | Legacy/unverified | Legacy | Duplicates order/payment status concepts. |
| `GET /api/Sales/overdue` | Legacy overdue sales | Admin JWT | Legacy/unverified | Legacy | Reporting source-of-truth unclear. |
| `GET /api/Sales/total` | Legacy total sales | Admin JWT | Legacy/unverified | Legacy | Reporting source-of-truth unclear. |
| `GET /api/Sales/client/{clientId}/total` | Legacy client total | Admin JWT | Legacy/unverified | Legacy | Reporting source-of-truth unclear. |
| `GET /api/Sales/monthly/{year}` | Legacy monthly sales | Admin JWT | Legacy/unverified | Legacy | Reporting source-of-truth unclear. |
| `GET /api/Sales/monthly/{year}/by-product` | Legacy monthly by product | Admin JWT | Legacy/unverified | Legacy | Reporting source-of-truth unclear. |
| `GET /api/Sales/monthly/{year}/by-client` | Legacy monthly by client | Admin JWT | Legacy/unverified | Legacy | Reporting source-of-truth unclear. |
| `GET /api/Sales/analysis/{year}` | Legacy sales analysis | Admin JWT | Legacy/unverified | Legacy | Reporting source-of-truth unclear. |
| `GET /api/Plants` | Plant list | Admin JWT | Legacy/unverified | Legacy / Unverified | Not confirmed relevant to FreshMooz storefront/admin launch. |
| `GET /api/Plants/{id}` | Plant detail | Admin JWT | Legacy/unverified | Legacy / Unverified | Not confirmed relevant to FreshMooz storefront/admin launch. |
| `POST /api/Plants` | Create plant | Admin JWT | Legacy/unverified | Legacy / Unverified | Not confirmed relevant to FreshMooz storefront/admin launch. |
| `PUT /api/Plants/{id}` | Update plant | Admin JWT | Legacy/unverified | Legacy / Unverified | Not confirmed relevant to FreshMooz storefront/admin launch. |
| `DELETE /api/Plants/{id}` | Delete plant | Admin JWT | Legacy/unverified | Legacy / Unverified | Not confirmed relevant to FreshMooz storefront/admin launch. |
| `GET /api/User` | Admin user list | Admin JWT | Admin/unverified | Unverified | Separate from customer/client profile APIs. |
| `GET /api/User/{id}` | Admin user detail | Admin JWT | Admin/unverified | Unverified | Separate from customer/client profile APIs. |
| `POST /api/User` | Create user | Admin JWT | Admin/unverified | Unverified | Separate from public registration and client APIs. |
| `PUT /api/User/{id}` | Update user | Admin JWT | Admin/unverified | Unverified | Separate from public registration and client APIs. |
| `DELETE /api/User/{id}` | Delete user | Admin JWT | Admin/unverified | Unverified | Separate from public registration and client APIs. |

## Missing routes confirmed by audit

| Route/capability | Purpose | Authentication | Consumer | Status | Known mismatch or risk |
|---|---|---|---|---:|---|
| Public-safe checkout endpoint or DTO contract | Guest checkout without server-controlled fields | Public | Storefront | Missing | Current `POST /api/Orders` is unsafe for public use. |
| Public-safe cart pricing endpoint or DTO contract | Server-owned pricing from product IDs/quantities only | Public | Storefront | Missing | Current pricing accepts price/discount overrides. |
| Guest order lookup endpoint | Safe post-checkout order confirmation | Public with secure token or verification | Storefront | Missing | Current order detail requires JWT. |
| Checkout idempotency route/header support | Duplicate submission protection | Public/authenticated | Storefront | Missing | Current checkout can duplicate orders. |
| Payment intent/session endpoint | Verified online payment initiation | Public/authenticated | Storefront | Missing | Required only if online payment is launch scope. |
| Payment webhook endpoint | Verified provider callback | Provider-signed | Payment provider/internal | Missing | Required only if online payment is launch scope. |
| Product slug endpoint | API-backed product detail by slug | Public | Storefront | Missing | Storefront currently uses local/static slug data. |
| Category endpoints | Dynamic category browsing/admin | Public/admin | Storefront/admin | Missing | Not launch blocker if categories stay static. |
| Variant endpoints | Dynamic product options | Public/admin | Storefront/admin | Missing | Not launch blocker if variants stay static/unsupported. |
| Health/readiness endpoint | Deployment monitoring | Public/internal | Ops | Missing | No route confirmed. |
