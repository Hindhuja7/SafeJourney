# Autocomplete API Migration

## ✅ **Changed: TomTom → Nominatim (OpenStreetMap)**

### Why?
- TomTom autocomplete ran out of credits (403 error)
- Nominatim is **completely FREE** with no API key needed
- No credit limits or usage restrictions

### What Changed?

**Before (TomTom):**
```javascript
// Required API key, costs credits
const url = `https://api.tomtom.com/search/2/search/${query}.json?key=${API_KEY}&typeahead=true`;
```

**After (Nominatim):**
```javascript
// FREE, no API key needed
const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`;
```

### Benefits

✅ **Free Forever** - No credits, no limits
✅ **No API Key** - No setup required
✅ **Open Source** - Community maintained
✅ **Global Coverage** - Works worldwide
✅ **Same Interface** - Frontend code unchanged

### API Details

**Nominatim (OpenStreetMap)**
- URL: `https://nominatim.openstreetmap.org/search`
- Rate Limit: 1 request/second (generous for autocomplete)
- Documentation: https://nominatim.org/release-docs/develop/api/Search/
- User-Agent: Required (set to 'SafeJourneyApp/1.0')

### Response Format

Nominatim returns the same structure as TomTom:
```json
{
  "address": "Tarnaka, Hyderabad, Telangana, India",
  "lat": 17.3972,
  "lon": 78.4865,
  "type": "suburb",
  "poiName": null
}
```

### Testing

The autocomplete should now work without any 403 errors!

Try typing in the origin/destination fields - you should see suggestions appear.

### Rate Limiting

Nominatim has a rate limit of **1 request per second**. For autocomplete, this is usually fine because:
- Users type slowly
- Debouncing is already implemented (waits 300ms after typing stops)
- Only 5 results per request

If you need higher limits, you can:
1. Self-host Nominatim
2. Use a commercial Nominatim provider
3. Add caching to reduce API calls

### Other Free Alternatives

If Nominatim doesn't work well, you can also use:

1. **Mapbox Geocoding** (free tier: 100k requests/month)
2. **Google Places Autocomplete** (free tier: $200 credit/month)
3. **Here Geocoding** (free tier: 250k requests/month)

But Nominatim is the best free option with no limits!

