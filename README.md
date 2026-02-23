Standard Paneer — E‑commerce (Next.js + .NET 8)

Overview
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS in `frontend/`.
- Backend: .NET 8 Minimal API in `backend/StandardPaneer.Api/`.
- SEO: Metadata API, sitemap, robots, JSON‑LD on product pages.
- Ready for future mobile apps via the same REST API.

Prerequisites
- Node.js 18+ (Next.js 14 requires Node 18 or newer)
- .NET SDK 8.x
- PostgreSQL 13+ (local or managed)

Quick Start
1) Backend API
   - Path: `backend/StandardPaneer.Api`
   - Configure DB: update `appsettings.Development.json` connection string.
   - Run: `dotnet run`
   - Serves at: `http://localhost:5079`
   - Swagger (dev): `http://localhost:5079/swagger`

   API Endpoints
   - `GET /health` — service health
   - `GET /api/v1/products` — list products
   - `GET /api/v1/products/{slug}` — product by slug
   - `POST /api/v1/cart/price` — price items `{ items: [{ productId, qty }] }`
   - `POST /api/v1/checkout` — checkout stub

   Notes (Database)
   - On first run, the API calls `EnsureCreated()` and seeds sample products if empty.
   - For production, switch to proper EF Core migrations:
     - Install tools: `dotnet tool install --global dotnet-ef`
     - Add migration: `dotnet ef migrations add InitialCreate -p backend/StandardPaneer.Api`
     - Update DB: `dotnet ef database update -p backend/StandardPaneer.Api`
     - Replace `EnsureCreated()` with `Migrate()` in `Program.cs`.

2) Frontend
   - Path: `frontend`
   - Env vars (already added for you):
     - `NEXT_PUBLIC_API_BASE=https://localhost:44319`
     - `NEXT_PUBLIC_PRODUCTS_ENDPOINT=/api/Products`
   - Install deps: `npm install`
   - Dev server: `npm run dev` (defaults to `http://localhost:3000`)

Notes
- CORS allows `http://localhost:3000` by default; update origins in `Program.cs` if you change the frontend port.
- Frontend gracefully falls back to mock data if the API is down.
- To modify SEO base URLs, update `src/app/layout.tsx`, `sitemap.ts`, and `robots.ts`.
- For HTTPS APIs on localhost, ensure the dev certificate is trusted:
  - `dotnet dev-certs https --trust` (then restart the frontend dev server)
- Product images from external API
  - Frontend expects a filename/URL in any of these fields: `image`, `imageUrl`, `imageFileName`, or `ImageFileName`.
  - It builds a URL using `NEXT_PUBLIC_IMAGE_BASE` (default `/media`). Example: filename `paneer.jpg` -> `/media/paneer.jpg`.
  - To serve images from the API, set `NEXT_PUBLIC_IMAGE_BASE` to an absolute URL like `https://localhost:44319/images` and serve static files there.
  - InventoryManagement.API changes (suggested):
    1. Add property to `Models/Product.cs`: `public string? ImageFileName { get; set; }`
    2. Add EF migration: `dotnet ef migrations add AddProductImage -p InventoryManagement.API`
    3. Update DB: `dotnet ef database update -p InventoryManagement.API`
    4. Put files under `wwwroot/images` and enable static files in Program.cs: `app.UseStaticFiles();`
    5. Then set `NEXT_PUBLIC_IMAGE_BASE=https://localhost:44319/images`

Next Steps
- Replace in‑memory product list with a database (SQL or document DB).
- Add auth (JWT) for checkout/profile endpoints.
- Integrate payments (e.g., Razorpay/Stripe) in `POST /api/v1/checkout`.
- Add admin UI for inventory and orders.
