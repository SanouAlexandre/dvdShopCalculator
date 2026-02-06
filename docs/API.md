# API Documentation

The DVD Shop Calculator provides a REST API for calculating DVD prices.

## Base URL

- **Development**: `http://localhost:3000`
- **Vercel (Production)**: `https://dvd-shop-calculator.vercel.app`
- **Custom Domain**: `https://dvd-shop-calculator.syascale.com`

## Endpoints

### Health Check

Check if the API is running.

```http
GET /health
```

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2026-02-04T12:00:00.000Z"
}
```

---

### Calculate Cart Price

Calculate the total price for a cart of DVDs.

```http
POST /api/calculate
Content-Type: application/json
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `items` | `string[]` | Yes | Array of movie titles |

#### Example Request

```bash
curl -X POST http://localhost:3000/api/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      "Back to the Future 1",
      "Back to the Future 2",
      "Back to the Future 3"
    ]
  }'
```

#### Success Response (200 OK)

```json
{
  "totalPrice": 36,
  "currency": "EUR",
  "itemsCount": 3,
  "discountApplied": "20%",
  "breakdown": {
    "totalPrice": 36,
    "currency": "EUR",
    "formattedPrice": "36 €",
    "itemsCount": 3,
    "discountApplied": "20%",
    "breakdown": {
      "bttfMovies": {
        "count": 3,
        "basePrice": 45,
        "discountedPrice": 36
      },
      "otherMovies": {
        "count": 0,
        "price": 0
      }
    }
  }
}
```

#### Error Response (400 Bad Request)

```json
{
  "error": "Invalid request",
  "message": "Request body must contain an \"items\" array of movie titles"
}
```

---

## Pricing Rules

### Standard DVDs
- **Price**: 20 €

### Back to the Future DVDs
- **Base Price**: 15 €
- **2 different episodes**: 10% discount on all BTTF DVDs
- **3 different episodes**: 20% discount on all BTTF DVDs

### Valid BTTF Titles
- `Back to the Future 1`
- `Back to the Future 2`
- `Back to the Future 3`

Note: Titles are case-insensitive.

---

## Examples

### Example 1: Complete Trilogy

**Request:**
```json
{
  "items": [
    "Back to the Future 1",
    "Back to the Future 2",
    "Back to the Future 3"
  ]
}
```

**Response:**
```json
{
  "totalPrice": 36,
  "discountApplied": "20%"
}
```

Calculation: 3 × 15 € × 0.8 = 36 €

---

### Example 2: Two BTTF Movies

**Request:**
```json
{
  "items": [
    "Back to the Future 1",
    "Back to the Future 2"
  ]
}
```

**Response:**
```json
{
  "totalPrice": 27,
  "discountApplied": "10%"
}
```

Calculation: 2 × 15 € × 0.9 = 27 €

---

### Example 3: Mixed Cart

**Request:**
```json
{
  "items": [
    "Back to the Future 1",
    "Back to the Future 2",
    "Back to the Future 3",
    "La chèvre"
  ]
}
```

**Response:**
```json
{
  "totalPrice": 56,
  "discountApplied": "20%"
}
```

Calculation: (3 × 15 € × 0.8) + 20 € = 36 € + 20 € = 56 €

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Endpoint doesn't exist |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, no rate limiting is applied. For production use, consider implementing rate limiting at the load balancer level.
