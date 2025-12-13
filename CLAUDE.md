# Claude Code Context

## GRC Data Model

**Critical**: Understand this flow before modifying GRC-related code.

### Tables

| Table | Purpose | Created When |
|-------|---------|--------------|
| `grcPurchases` | Tracks merchant inventory purchases | Merchant submits purchase order |
| `grcs` | Individual certificates issued to customers | Merchant issues GRC to a customer |

### Flow

```
1. Merchant purchases GRCs
   └─> Creates grcPurchases record (paymentStatus: "pending")

2. Admin approves payment
   └─> Updates grcPurchases.paymentStatus to "confirmed"
   └─> Does NOT create any grcs records

3. Merchant issues GRC to customer
   └─> Creates grcs record (linked to customer)
   └─> Inventory decreases
```

### Inventory Calculation

```typescript
available = sum(grcPurchases.quantity where confirmed) - count(grcs)
```

**Important**: The `grcs` table should ONLY contain certificates that have been issued to customers. Never pre-create GRC records - they are created on-demand when a merchant issues to a customer.

### Why This Matters

If GRC records are created at approval time, the inventory calculation breaks:
- Purchased: 5 (from grcPurchases)
- "Issued": 5 (from grcs - but actually just placeholders)
- Available: 0 ← WRONG

---

## Form Field Guidelines

### Label Spacing
Labels have `mb-2` bottom margin (built into the Label component). This creates proper visual separation between label text and input fields.

### Form Field Structure
```tsx
<div>
  <Label htmlFor="email">Email *</Label>
  <Input id="email" type="email" placeholder="..." />
  <p className="text-xs text-muted-foreground mt-1">Helper text</p>
</div>
```

### Spacing Between Fields
Use `space-y-4` on the form or parent container for consistent vertical spacing between form groups.

### Required Fields
Mark required fields with `*` in the label text, not with a separate indicator.

---

## Preventing Layout Shift (CLS)

When content loads asynchronously, prevent Cumulative Layout Shift by reserving space:

```tsx
// BAD - height changes when data loads
<div className="flex gap-2">
  {isLoading ? "Loading..." : items.map(...)}
</div>

// GOOD - fixed min-height prevents shift
<div className="flex gap-2 min-h-[32px] items-center">
  {isLoading ? "Loading..." : items.map(...)}
</div>
```

Common patterns:
- Inventory chips: `min-h-[32px]`
- Table rows: Use `table-fixed` with `<colgroup>` for fixed column widths
- Stats cards: Fixed grid with consistent card heights
- Images: Always set `width` and `height` attributes

---

## Vercel Environment Variables

When adding environment variables to Vercel via CLI, use `printf` instead of `echo` to avoid adding a trailing newline (`\n`) that corrupts API keys and other values.

```bash
# WRONG - echo adds \n to the value
echo "my-api-key" | vercel env add VAR_NAME production

# CORRECT - printf does not add \n
printf "my-api-key" | vercel env add VAR_NAME production
```

## Deployment

After adding/updating env vars, redeploy with `--force` to skip cache:
```bash
vercel --prod --force
```

## Server-Side Pagination Pattern

### API Endpoints

All list endpoints should support pagination with these query params:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `status` - Optional filter by status
- `search` - Optional search query

Response format:
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  },
  "stats": { ... }
}
```

Example API implementation (Drizzle):
```typescript
const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
const offset = (page - 1) * limit;

// Count query
const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(table).where(whereClause);
const totalPages = Math.ceil(count / limit);

// Data query with pagination
const data = await db.select().from(table).where(whereClause).limit(limit).offset(offset);

return { data, pagination: { total: count, page, limit, totalPages } };
```

### Frontend Component

Use the `<Pagination />` component from `@/components/ui/pagination`:
```tsx
import { Pagination } from "@/components/ui/pagination";

<Pagination
  page={page}
  totalPages={totalPages}
  total={total}
  limit={20}
  onPageChange={setPage}
  disabled={isLoading}
/>
```

Key patterns:
- Reset page to 1 when filters/search change
- Debounce search input (300ms)
- Pass filters to API, don't filter client-side
- Use `useCallback` for fetch function with deps: `[page, filter, debouncedSearch]`

## Table Layout Standards

### Page Structure Order

```
PageHeader (title + description)
Stats Row (2x2 mobile, 4-col desktop)
Search Input
Filter Tabs (+ Refresh button right-aligned)
Table/Cards
Pagination
```

### Responsive Pattern

Desktop (md+) uses `table-fixed` with `<colgroup>`. Mobile (<md) uses cards.

```tsx
{/* Mobile cards */}
<div className="md:hidden divide-y divide-border">
  {items.map(item => <MobileCard key={item.id} />)}
</div>

{/* Desktop table */}
<table className="w-full hidden md:table table-fixed">
  <colgroup>
    <col className="w-[25%]" />
    <col className="w-[15%]" />
    {/* fixed widths prevent layout shift on load */}
  </colgroup>
  <thead className="bg-muted/50 border-b">...</thead>
  <tbody className="divide-y divide-border">...</tbody>
</table>
```

### Loading Behavior

- Table headers always visible (no skeleton)
- Empty tbody while loading, rows appear when ready
- Refresh button shows spinner: `<RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />`
- Pagination disabled while loading

```tsx
<tbody>
  {!isLoading && items.length === 0 ? (
    <tr><td colSpan={N} className="px-4 py-8 text-center text-muted-foreground">No items found</td></tr>
  ) : (
    items.map(item => <tr>...</tr>)
  )}
</tbody>
```

### Stats Cards (Compact)

2x2 on mobile, 4-col on desktop:

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
  <div className="bg-card border rounded-lg p-3 sm:p-4">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      <Icon className="w-4 h-4" />
      <span className="text-xs sm:text-sm">Label</span>
    </div>
    <div className="text-lg sm:text-2xl font-bold">{count}</div>
    <div className="text-xs sm:text-sm text-muted-foreground">{subtext}</div>
  </div>
</div>
```

### Search + Filter Tabs

```tsx
{/* Search above filters */}
<div className="relative mb-4">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 max-w-md" />
</div>

{/* Filter tabs with refresh */}
<div className="flex gap-2 mb-6">
  <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => handleFilterChange("pending")}>
    <Clock className="w-4 h-4 mr-1" /> Pending
  </Button>
  {/* more tabs... */}
  <Button variant="ghost" size="sm" onClick={refetch} disabled={isLoading} className="ml-auto">
    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
  </Button>
</div>
```

### Mobile Card Template

```tsx
<div className="p-4">
  {/* Header: Title + Status badge */}
  <div className="flex items-start justify-between gap-3 mb-3">
    <div className="min-w-0">
      <h3 className="font-semibold truncate">{title}</h3>
      <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
    </div>
    <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0 bg-yellow-100 text-yellow-800">{status}</span>
  </div>

  {/* Key metric box */}
  <div className="bg-muted/50 rounded-lg p-3 mb-3">
    <div className="flex items-baseline justify-between">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm text-muted-foreground">{detail}</span>
    </div>
  </div>

  {/* Meta row */}
  <div className="flex items-center gap-2 text-sm mb-2">
    <Icon className="w-4 h-4" />
    <span className="font-medium">Type</span>
    <span className="text-muted-foreground">•</span>
    <span className="text-muted-foreground truncate">{info}</span>
  </div>
  <p className="text-xs text-muted-foreground mb-3">{date}</p>

  {/* Action buttons */}
  <div className="flex gap-2">
    <Button className="flex-1"><CheckCircle2 className="w-4 h-4 mr-2" />Approve</Button>
    <Button variant="outline" className="flex-1"><XCircle className="w-4 h-4 mr-2" />Reject</Button>
  </div>
</div>
```

### State Management

```tsx
// Data
const [items, setItems] = useState([]);
const [isLoading, setIsLoading] = useState(true);

// Filters
const [filter, setFilter] = useState("pending");
const [searchQuery, setSearchQuery] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState("");

// Pagination
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [total, setTotal] = useState(0);

// Debounce search (resets page)
useEffect(() => {
  const timer = setTimeout(() => { setDebouncedSearch(searchQuery); setPage(1); }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

// Filter change resets page
const handleFilterChange = (newFilter) => { setFilter(newFilter); setPage(1); };

// Fetch with useCallback
const fetchData = useCallback(async () => {
  setIsLoading(true);
  const params = new URLSearchParams({ page: page.toString(), limit: "20" });
  if (filter !== "all") params.set("status", filter);
  if (debouncedSearch) params.set("search", debouncedSearch);
  const res = await fetch(`/api/endpoint?${params}`);
  const data = await res.json();
  setItems(data.items);
  setTotalPages(data.pagination.totalPages);
  setTotal(data.pagination.total);
  setIsLoading(false);
}, [page, filter, debouncedSearch]);

useEffect(() => { fetchData(); }, [fetchData]);
```
