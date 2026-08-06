# BGD/INK Production Backend Contract

## Status

This document defines the boundary between the React storefront and the future Frappe/ERPNext backend. The current implementation still uses a clearly labeled local prototype adapter. No endpoint below should be considered implemented until it has authentication, validation, tests, and deployment configuration.

## Principles

1. The browser never decides authoritative prices, stock, order numbers, delivery fees, or workflow status.
2. Original artwork is uploaded before an order is accepted and receives a durable asset identifier.
3. Customer-facing payloads use public IDs; internal Frappe document names remain server concerns.
4. All write endpoints are idempotent and return a request or order ID.
5. File type, size, dimensions, and content are validated on both client and server.
6. Staff operations occur in authenticated Frappe Desk views, never through a secret embedded in the storefront.

## Proposed Frappe DocTypes

### Print Product

- Public product ID
- English and Arabic names/descriptions
- Active flag
- Product type
- Primary media
- Available print methods

### Print Product Variant

- Product
- SKU
- Size
- Color
- Price
- Stock status or available quantity
- 3D model configuration

### Print Area

- Product or variant
- Surface: front, back, left sleeve, right sleeve, or custom
- Physical width and height in centimeters
- Model-space transform and boundary polygon
- Safe margin

### Design Asset

- Public asset ID
- Original private file
- Preview derivative
- MIME type
- Pixel width and height
- File size
- Checksum
- Transparency flag
- Ownership/session reference
- Scan and validation status

### Custom Print Order

- Public order ID
- Customer and contact details
- Delivery address
- Currency and totals
- Workflow status
- Source and idempotency key
- Linked ERPNext Sales Order when approved

### Custom Print Order Item

- Order
- Product and variant
- Quantity
- Unit and line totals
- Customer notes
- Generated proof

### Print Placement

- Order item
- Design asset
- Print area
- Layer order
- Position, size, and rotation in physical units
- Preview transform
- Production notes

## Storefront API surface

Paths below are illustrative Frappe method routes. Exact module names may change during P1.

### `GET /api/method/bgd_ink.api.catalog.list_products`

Returns active products, variants, localized content, server-authoritative prices, availability, print areas, and versioned media/model URLs.

### `GET /api/method/bgd_ink.api.catalog.get_product`

Inputs:

- `product_id`

Returns one product with all selectable variants and editor configuration.

### `POST /api/method/bgd_ink.api.assets.create_upload`

Inputs:

- file name
- MIME type
- byte size
- optional checksum

Returns a short-lived upload target and public `asset_id`. The final asset remains unusable until validation completes.

### `POST /api/method/bgd_ink.api.assets.complete_upload`

Inputs:

- `asset_id`
- checksum
- pixel dimensions supplied by the client as advisory metadata

The server verifies storage metadata, scans the file, extracts authoritative dimensions, and creates preview derivatives.

### `POST /api/method/bgd_ink.api.orders.quote`

Inputs:

- variant IDs and quantities
- placement specifications
- delivery area
- coupon when applicable

Returns authoritative line totals, delivery fee, warnings, expiration time, and `quote_id`.

### `POST /api/method/bgd_ink.api.orders.create`

Inputs:

- `quote_id`
- customer and delivery information
- validated asset IDs
- placement specifications
- idempotency key

Returns the public order ID, accepted totals, next action, and workflow status.

### `GET /api/method/bgd_ink.api.orders.get_status`

Inputs:

- public order ID
- signed customer access token

Returns a customer-safe status timeline without exposing Desk-only information.

## Error shape

```json
{
  "ok": false,
  "error": {
    "code": "ARTWORK_TOO_LARGE",
    "message": "The uploaded file exceeds the allowed size.",
    "field": "asset",
    "retryable": false,
    "request_id": "req_..."
  }
}
```

## Required server controls

- Rate limits on catalog abuse, uploads, quotes, and order creation
- CSRF/session protection or short-lived signed guest tokens
- Idempotency keys for order creation
- Object-storage upload restrictions and expiration
- MIME sniffing rather than extension-only checks
- Malware scanning and image decoding in an isolated worker
- Private originals with signed download access for authorized production staff
- Audit logging for price, status, artwork, and placement changes
- Server-side total recalculation before any order is accepted
- Data-retention and deletion policy for abandoned drafts

## Migration from the prototype

Legacy browser drafts may be imported later, but they must be treated as untrusted input. The production adapter must revalidate products, variants, artwork, price, stock, and addresses before creating a real order.
