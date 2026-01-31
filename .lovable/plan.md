
# Plan: Add Feed Button Back to Navigation

## Summary
Add the Feed navigation item back to the main navigation array in `MainLayout.tsx`. The `Home` icon is already imported, so we just need to add the navigation entry.

## Change Required

**File: `src/layouts/MainLayout.tsx`**

Add the Feed item as the first entry in the navigation array (line 37-43):

```typescript
const navigation = [
  { name: 'Feed', href: '/feed', icon: Home },  // Add this line
  { name: 'Discover', href: '/discover', icon: Compass },
  { name: 'Markets', href: '/markets', icon: BarChart3 },
  { name: 'Live', href: '/live', icon: Video },
  { name: 'Messages', href: '/messages', icon: MessageCircle },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];
```

## Technical Details
- The `Home` icon from `lucide-react` is already imported on line 6
- This restores the Feed button that was previously removed
- The button will appear first in the navigation bar (after the logo/search area)
- Active state styling will work automatically via the existing `isActive` function
