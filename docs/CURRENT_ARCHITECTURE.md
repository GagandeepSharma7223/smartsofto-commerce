# Current Architecture

Status labels used in this document: **Confirmed**, **Partial**, **Missing**, **Planned**, **Unverified**.

## Main projects

```text
code/
├─ backend/
│  ├─ SmartSofto.Commerce.Api/
│  ├─ SmartSofto.Commerce.Application/
│  ├─ SmartSofto.Commerce.Domain/
│  ├─ SmartSofto.Commerce.Infrastructure/
│  ├─ SmartSofto.Commerce.Shared/
│  ├─ SmartSofto.Commerce.Api.Tests/
│  └─ SmartSofto.Commerce.Infrastructure.Tests/
├─ frontend/
│  ├─ freshmooz-web/
│  ├─ freshmooz-admin/
│  ├─ ui-core/
│  └─ legacy app under frontend/src/
├─ design-system/freshmooz/
└─ .deploy/
```

## Project responsibilities

| Project | Status | Responsibility |
|---|---|---|
| `SmartSofto.Commerce.Api` | Confirmed | ASP.NET Core API, controllers, auth setup, DI, CORS, Swagger, startup seeding. |
| `SmartSofto.Commerce.Application` | Confirmed | DTOs, interfaces, and application-level contracts. |
| `SmartSofto.Commerce.Domain` | Confirmed | Core entities and enums for products, clients, orders, invoices, inventory, tenants, addresses, and sales. |
| `SmartSofto.Commerce.Infrastructure` | Confirmed | EF Core DbContext, migrations, Identity user, and concrete business services. |
| `SmartSofto.Commerce.Shared` | Partial | Placeholder project. No meaningful shared code confirmed. |
| `freshmooz-web` | Confirmed | FreshMooz customer storefront. |
| `freshmooz-admin` | Confirmed | FreshMooz admin panel. |
| `frontend/ui-core` | Partial | Intended shared frontend package, currently minimal. |
| `frontend/src` legacy app | Partial | Older mixed frontend/admin code. Not confirmed as source of truth. |

## Source-of-truth frontend apps

- **Confirmed:** `frontend/freshmooz-web` is the active FreshMooz customer storefront.
- **Confirmed:** `frontend/freshmooz-admin` is the active FreshMooz admin panel.
- **Partial:** `frontend/ui-core` exists but is not yet a meaningful shared component library.
- **Unverified:** The older `frontend/src` app may be legacy. Owner confirmation is required before deleting or migrating it.

## Request flow

```text
Storefront page/component
→ frontend API helper
→ ASP.NET API controller
→ Application interface
→ Infrastructure service
→ EF Core ApplicationDbContext
→ PostgreSQL database
```

Product browsing:

```text
freshmooz-web
→ GET /api/Products
→ ProductsController
→ ProductService
→ Products table
```

Admin operations:

```text
freshmooz-admin
→ authenticated API call with JWT
→ admin/product/order/inventory/client/invoice controller
→ infrastructure service
→ PostgreSQL
```

## Cart and checkout flow

```text
AddToCartButton
→ localStorage cart
→ /cart reads localStorage and fetches products
→ /checkout reads localStorage
→ POST /api/Orders/price
→ POST /api/Orders
→ OrderService.CreateOrderAsync
→ Client / ClientAddress / Order / OrderItems / Invoice / InventoryTransactions
→ /order/success
```

### Checkout status

- **Confirmed:** Cart is browser-local via `localStorage`.
- **Confirmed:** `POST /api/Orders/price` is anonymous and prices cart lines server-side.
- **Confirmed:** `POST /api/Orders` is anonymous and can create guest orders.
- **Confirmed:** Backend creates an unpaid invoice automatically during order creation.
- **Confirmed:** Backend deducts inventory during order creation.
- **Partial:** Guest checkout confirmation is not reliable because the frontend expects `orderId`/`OrderId`, while the backend returns `Id`.
- **Partial:** Guest order detail lookup is not reliable because the order detail helper expects authenticated access and uses a non-API `/orders/{id}` URL pattern.
- **Missing:** Idempotency protection for duplicate checkout submissions.
- **Missing:** Real online payment provider and payment webhook.

## Confirmed capabilities

- ASP.NET Core API with layered projects.
- PostgreSQL persistence through EF Core.
- ASP.NET Identity authentication.
- JWT tokens with user, role, and tenant claims.
- Admin/User roles.
- Product CRUD, archive, restore, image filename, active flag.
- Product quantity and inventory transaction ledger.
- Loose quantity support.
- Client/customer records.
- Client addresses.
- Order creation with order items.
- Server-side cart/order pricing.
- Automatic unpaid invoice creation during order creation.
- Manual/admin payment recording.
- Client credit/advance ledger.
- Admin dashboard, products, orders, invoices, inventory, clients, and analytics.
- FreshMooz storefront pages for home, products, product detail, cart, checkout, auth, and orders.
- Backend tests for selected inventory, order, client, contact, and tenant behavior.

## Partial or missing capabilities

| Capability | Status | Notes |
|---|---|---|
| Multi-store / tenant handling | Partial | Tenant entity and tenant fields exist. Anonymous flows fall back to tenant `1`; domain/store resolution is missing. |
| Categories | Partial | Storefront category UI exists. Backend category entity was not confirmed. |
| Variants | Partial | Storefront variant-like grouping exists. Backend product variant model was not confirmed. |
| Pricing | Partial | Product price and order pricing exist. Public request can include unit price/discount fields, which is unsafe. |
| Inventory safety | Partial | Stock validation and deduction exist. Concurrency protection was not confirmed. |
| Cart | Partial | Storefront local cart exists. No backend cart. |
| Checkout | Partial | Guest order creation exists. Confirmation, idempotency, and payment boundaries need fixes. |
| Payments | Partial | Manual payment labels exist: Cash, UPI, Cheque. No real online integration. |
| Payment webhooks | Missing | No provider webhook found. |
| Notifications/emails | Partial | Password reset/contact email exists. Order confirmation email not found. |
| Search | Partial | Storefront filtering/search exists. Backend search service not confirmed. |
| Reporting | Partial | Admin analytics exist but are limited. |
| Product subscriptions | Missing | Planned for future, not implemented. |
| Audit logging | Missing | No dedicated audit log found. |
| Feature flags | Missing | No feature flag system found. |

## Reusable areas

- Backend product, order, invoice, inventory, client, address, and tenant foundations.
- EF Core migration-based persistence.
- Identity/JWT authentication foundation.
- Admin CRUD and operational modules.
- Storefront product/cart UI patterns.
- Shared styling conventions in FreshMooz components.

## FreshMooz-specific coupling

- Seed/default tenant is FreshMooz-oriented.
- Anonymous tenant fallback uses tenant `1`.
- FreshMooz storefront copy, categories, product composition, imagery, and homepage sections.
- FreshMooz admin branding.
- CORS and production domains include FreshMooz/SmartSofto-specific values.
- Checkout UI contains Gurugram/Haryana/India-specific delivery assumptions.
- Design-system notes are FreshMooz-specific.

## Known risks

- Public checkout can accept client-supplied `UnitPrice` and `DiscountAmount`.
- Public checkout can accept `PaymentAmount`, which can mark an order paid without verified payment.
- No duplicate-submission/idempotency protection.
- Inventory check/deduct flow does not have confirmed concurrency protection.
- Guest confirmation/order lookup is incomplete.
- Client/address creation is not fully within the same transaction boundary as order creation in all paths.
- Secrets were observed in source configuration during review and should be rotated/removed from committed config.
- Reusable platform boundaries are not yet clean; shared backend/frontend projects are mostly placeholders.
- Legacy frontend code creates ambiguity.

## Unresolved owner decisions

- Should one-time checkout be guest-first, account-first, or both?
- Should online payment be required for launch, or should launch support unpaid/manual payment orders?
- Which payment provider should be used?
- What are the real delivery area, tax, return, and support policies?
- How should tenants be resolved for future stores: domain, subdomain, path, header, or separate deployment?
- Should products use true backend variants/options or separate product rows?
- Which frontend code should be retired once `freshmooz-web` and `freshmooz-admin` are confirmed as canonical?
