# Functional Requirements Document: Merchant Page Editor v2.0

## Overview

Transform the admin merchant edit page into a best-in-class editing experience with live preview, drag-and-drop uploads, auto-save, and intelligent quick-fill features.

**Current Location**: `/src/app/admin/merchants/[id]/edit/page.tsx`

---

## 1. User Experience Goals

| Goal | Description |
|------|-------------|
| **Instant Feedback** | Live preview updates as user types |
| **Zero Data Loss** | Auto-save with undo capability |
| **Minimal Friction** | Drag-and-drop for images, quick-fill for hours |
| **Progress Visibility** | Clear indication of profile completeness |
| **Mobile-Friendly** | Full functionality on all devices |

---

## 2. Feature Requirements

### 2.1 Live Preview Panel

**Description**: Side-by-side layout showing real-time preview of the merchant page as edits are made.

**Requirements**:
- [ ] Split layout: Form (60%) | Preview (40%) on desktop
- [ ] Preview updates instantly on every keystroke
- [ ] Design selector dropdown to switch between 4 styles (Art Deco, Gatsby, Hollywood, Parisian)
- [ ] Preview scrollable independently of form
- [ ] Mobile: Preview accessible via floating button, opens in slide-over sheet

**Acceptance Criteria**:
- Typing in business name immediately updates preview header
- Changing hours shows updated hours section in preview
- Adding a photo shows it in the preview gallery within 1 second
- Design selector persists during session

---

### 2.2 Drag-and-Drop Image Upload

**Description**: Modern image upload experience for logo and photo gallery.

**Requirements**:
- [ ] Drag files onto drop zone to upload
- [ ] Click drop zone to open file picker
- [ ] Show upload progress indicator
- [ ] Preview image immediately (before upload completes)
- [ ] Support JPEG, PNG, WebP, GIF formats
- [ ] Max file size: 10MB per image
- [ ] Error states with retry option

**Logo Upload**:
- [ ] Single image, replaces existing
- [ ] Square aspect ratio preview
- [ ] Stored at `logos/{timestamp}-{filename}`

**Photo Gallery**:
- [ ] Multiple images (unlimited)
- [ ] 16:9 aspect ratio preview thumbnails
- [ ] Drag to reorder photos
- [ ] Click X to remove
- [ ] Stored at `photos/{merchantId}/{timestamp}-{filename}`

**Acceptance Criteria**:
- Dragging image file onto zone highlights it
- Dropping shows immediate preview with spinner
- Upload completes in background
- Failed upload shows error with "Retry" button
- Photos can be reordered by dragging

---

### 2.3 Hours Quick-Fill

**Description**: Reduce repetitive data entry for business hours.

**Requirements**:
- [ ] Individual input for each day (existing)
- [ ] "Apply to Weekdays" button - copies Monday to Tue/Wed/Thu/Fri
- [ ] "Copy to All Days" button - copies Monday to all 7 days
- [ ] Presets dropdown with common schedules:
  - 9:00 AM - 5:00 PM
  - 10:00 AM - 6:00 PM
  - 10:00 AM - 9:00 PM
  - 8:00 AM - 8:00 PM
  - 24 Hours
  - Closed
- [ ] Clear individual day with X button

**Acceptance Criteria**:
- Setting Monday to "9:00 AM - 5:00 PM" then clicking "Apply to Weekdays" fills Tue-Fri with same value
- Selecting preset fills all 7 days
- Saturday/Sunday remain editable independently

---

### 2.4 Drag-to-Reorder

**Description**: Allow reordering of list items via drag and drop.

**Applies to**:
- [ ] Photo gallery images
- [ ] Services/menu items

**Requirements**:
- [ ] Drag handle icon on each item
- [ ] Visual feedback during drag (item lifts, placeholder shown)
- [ ] Drop to new position
- [ ] Order persists on save
- [ ] Touch-friendly on mobile (long-press to drag)

**Acceptance Criteria**:
- Grabbing drag handle allows repositioning
- Dropping item in new position reorders list
- Order is maintained after save and page reload

---

### 2.5 Auto-Save with Undo

**Description**: Automatically save changes to prevent data loss, with ability to undo.

**Requirements**:
- [ ] Auto-save triggers 3 seconds after last change
- [ ] Status indicator showing: Saving... → Saved at HH:MM → Error (retry)
- [ ] Undo button reverts to previous saved state
- [ ] Keep last 5 saved states in undo history
- [ ] Warn before leaving page with unsaved changes
- [ ] Manual "Save Now" button still available

**Status Indicator States**:
| State | Display |
|-------|---------|
| Clean | "All changes saved" (muted) |
| Dirty | "Unsaved changes" (yellow) |
| Saving | "Saving..." with spinner |
| Saved | "Saved at 2:34 PM" with checkmark |
| Error | "Error saving" with retry button (red) |

**Acceptance Criteria**:
- Making a change shows "Unsaved changes" immediately
- After 3 seconds of no changes, auto-save triggers
- Clicking undo reverts all fields to previous state
- Closing tab with unsaved changes shows browser warning
- Network error shows retry option, doesn't lose data

---

### 2.6 Rich Text Editor

**Description**: Formatted text editing for description and about/story fields.

**Requirements**:
- [ ] Replace plain textarea with TipTap editor
- [ ] Toolbar: Bold, Italic, Underline, Bullet List, Numbered List
- [ ] No image upload in these fields (keep simple)
- [ ] HTML stored in database, rendered on merchant page
- [ ] Character count indicator

**Fields**:
- Short Description (max 500 chars)
- About / Story (max 5000 chars)

**Acceptance Criteria**:
- Selecting text and clicking Bold makes it bold
- Bullet list creates proper list formatting
- Pasting from Word strips complex formatting
- Preview shows formatted text correctly

---

### 2.7 Field Completion Indicator

**Description**: Visual progress showing how complete the merchant profile is.

**Requirements**:
- [ ] Progress bar at top of form (0-100%)
- [ ] Section dots showing completion per section
- [ ] Tooltip on dots shows missing fields
- [ ] Percentage updates in real-time

**Completion Scoring**:
| Section | Fields | Points |
|---------|--------|--------|
| Business | Name (required), Category, Description, About | 4 |
| Location | Street, City (required), State (required), ZIP | 4 |
| Contact | Phone (required), Website, Instagram, Facebook, TikTok | 5 |
| Hours | Any 1 day filled | 1 |
| Media | Logo, Video, Any 1 photo | 3 |
| Services | Any 1 service | 1 |
| **Total** | | **18** |

**Acceptance Criteria**:
- New merchant shows ~20% (required fields only)
- Adding logo increases percentage
- Hovering section dot shows "Missing: Instagram, Facebook"
- 100% shows celebratory state (green, checkmark)

---

## 3. Technical Architecture

### 3.1 New Files to Create

```
src/
├── components/ui/
│   ├── image-uploader.tsx      # Drag-and-drop image upload
│   ├── sortable-list.tsx       # Generic drag-to-reorder
│   └── simple-rich-text.tsx    # Simplified TipTap wrapper
├── hooks/
│   └── use-auto-save.ts        # Debounced auto-save with undo
├── lib/
│   └── merchant-completion.ts  # Completion % calculator
└── app/
    ├── api/admin/merchant-pages/[id]/
    │   └── upload-photo/
    │       └── route.ts        # Photo upload endpoint
    └── admin/merchants/[id]/edit/
        └── _components/
            ├── hours-section.tsx
            ├── live-preview.tsx
            └── completion-indicator.tsx
```

### 3.2 Files to Modify

| File | Changes |
|------|---------|
| `/src/lib/storage.ts` | Add `uploadMerchantPhoto()` function |
| `/src/app/admin/merchants/[id]/edit/page.tsx` | Major refactor with new layout |
| `/package.json` | Add @dnd-kit dependencies |

### 3.3 Dependencies to Install

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## 4. UI/UX Specifications

### 4.1 Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────┐
│ ← Back    Edit Merchant Page                    [Undo] [Save]│
├─────────────────────────────────────────────────────────────┤
│ ████████████████████░░░░░░░░░░ 72% Complete                 │
│ ● Business  ● Location  ○ Contact  ● Hours  ○ Media  ○ Svc  │
├────────────────────────────────┬────────────────────────────┤
│                                │                            │
│  [Business] [Location] ...     │  Design: [Art Deco ▼]      │
│                                │                            │
│  ┌─────────────────────────┐   │  ┌──────────────────────┐  │
│  │ Business Name *         │   │  │                      │  │
│  │ [___________________]   │   │  │   LIVE PREVIEW       │  │
│  │                         │   │  │                      │  │
│  │ Category                │   │  │   Updates as you     │  │
│  │ [Select... ▼]           │   │  │   type...            │  │
│  │                         │   │  │                      │  │
│  │ Description             │   │  │                      │  │
│  │ [Rich text editor    ]  │   │  │                      │  │
│  │ [B I U • ≡]             │   │  │                      │  │
│  └─────────────────────────┘   │  └──────────────────────┘  │
│                                │                            │
│  Saving... ●                   │                            │
└────────────────────────────────┴────────────────────────────┘
```

### 4.2 Mobile Layout (<1024px)

```
┌─────────────────────────┐
│ ← Back    Edit Merchant │
├─────────────────────────┤
│ ████████░░░░ 72%        │
├─────────────────────────┤
│ [Bus][Loc][Con][Hr][Me] │
├─────────────────────────┤
│                         │
│  Business Name *        │
│  [_________________]    │
│                         │
│  Category               │
│  [Select... ▼]          │
│                         │
│  ...                    │
│                         │
│         [Preview 👁]    │ ← Floating button
└─────────────────────────┘

Tapping Preview opens sheet:
┌─────────────────────────┐
│ Preview    [Art Deco ▼] │
├─────────────────────────┤
│                         │
│    LIVE PREVIEW         │
│    (scrollable)         │
│                         │
└─────────────────────────┘
```

### 4.3 Image Uploader Component

```
Default state:
┌─────────────────────────────┐
│                             │
│      📷                     │
│      Drag image here        │
│      or click to browse     │
│                             │
│      Max 10MB               │
└─────────────────────────────┘

Dragging over:
┌─────────────────────────────┐
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │                      │   │
│  │    Drop to upload    │   │  (blue dashed border)
│  │                      │   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
└─────────────────────────────┘

Uploading:
┌─────────────────────────────┐
│  ┌─────────────────────┐    │
│  │   [blurred image]   │    │
│  │       ⟳ 45%         │    │
│  └─────────────────────┘    │
└─────────────────────────────┘

With image:
┌─────────────────────────────┐
│  ┌─────────────────────┐    │
│  │                     │ ✕  │  ← Remove button
│  │   [image preview]   │    │
│  │                     │    │
│  └─────────────────────┘    │
│  Click or drag to replace   │
└─────────────────────────────┘
```

### 4.4 Hours Section

```
┌──────────────────────────────────────────────────────────┐
│ Hours of Operation                                        │
│                                                          │
│ Quick Fill: [Apply to Weekdays] [Copy to All] [Presets ▼]│
├──────────────────────────────────────────────────────────┤
│ Monday    [9:00 AM - 5:00 PM_________] [✕]               │
│ Tuesday   [9:00 AM - 5:00 PM_________] [✕]               │
│ Wednesday [9:00 AM - 5:00 PM_________] [✕]               │
│ Thursday  [9:00 AM - 5:00 PM_________] [✕]               │
│ Friday    [9:00 AM - 5:00 PM_________] [✕]               │
│ Saturday  [10:00 AM - 4:00 PM________] [✕]               │
│ Sunday    [Closed_____________________] [✕]               │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Data Flow

### 5.1 Auto-Save Sequence

```
User types → Update local state → Start 3s debounce timer
                                          ↓
                              Timer expires (no new input)
                                          ↓
                              Set status = "saving"
                                          ↓
                              PATCH /api/admin/merchant-pages/{id}
                                          ↓
                    ┌─────────────────────┴─────────────────────┐
                    ↓                                           ↓
              Success                                       Error
                    ↓                                           ↓
        Push to undo history                          Set status = "error"
        Set status = "saved"                          Keep local changes
        Update lastSaved time                         Show retry button
```

### 5.2 Image Upload Sequence

```
User drops/selects file
        ↓
Validate (type, size)
        ↓ (valid)
Convert to base64 for preview
Show preview immediately
        ↓
POST /api/admin/merchant-pages/{id}/upload-photo
        ↓
    ┌───┴───┐
    ↓       ↓
 Success  Error
    ↓       ↓
Replace   Show error
base64    with retry
with URL
```

---

## 6. Verification Plan

### 6.1 Manual Testing Checklist

**Live Preview**:
- [ ] Type in business name, see it update in preview
- [ ] Add a service, see it appear in preview
- [ ] Switch design selector, preview re-renders with new style
- [ ] On mobile, tap preview button, sheet opens with preview

**Image Upload**:
- [ ] Drag image onto logo area, uploads and shows preview
- [ ] Click photo gallery area, file picker opens
- [ ] Upload 5MB image, succeeds
- [ ] Upload 15MB image, shows error
- [ ] Drag photos to reorder, order persists

**Hours**:
- [ ] Set Monday, click "Apply to Weekdays", Tue-Fri fill
- [ ] Select "24 Hours" preset, all days update
- [ ] Clear Sunday with X button

**Auto-Save**:
- [ ] Make change, wait 3 seconds, see "Saved" indicator
- [ ] Make change, immediately leave page, see warning
- [ ] Click undo, previous values restore
- [ ] Disconnect network, make change, see error with retry

**Rich Text**:
- [ ] Bold text in description, see bold in preview
- [ ] Create bullet list in about section
- [ ] Paste from Word, formatting simplified

**Completion**:
- [ ] New merchant shows low percentage
- [ ] Fill required fields, percentage increases
- [ ] Hover section dot, see missing fields tooltip

### 6.2 Edge Cases

- [ ] Very long business name (200 chars)
- [ ] No internet during upload
- [ ] Concurrent edits from two browser tabs
- [ ] Browser back button with unsaved changes
- [ ] Upload same image twice
- [ ] Empty services array saved correctly

---

## 7. Implementation Order

1. **Install dependencies** - @dnd-kit packages
2. **Create ImageUploader component** - Reusable, test in isolation
3. **Create SortableList component** - Reusable, test in isolation
4. **Add uploadMerchantPhoto to storage.ts** - Follow existing pattern
5. **Create upload-photo API endpoint** - Test with curl
6. **Create useAutoSave hook** - Test with simple form
7. **Create SimpleRichText component** - Based on existing TipTap
8. **Create merchant-completion.ts** - Pure function, easy to test
9. **Create HoursSection with quick-fill** - Standalone, testable
10. **Create LivePreview component** - Wire up design components
11. **Create CompletionIndicator** - Wire up completion calculator
12. **Refactor main edit page** - Bring it all together
13. **Add mobile responsiveness** - Preview sheet, touch drag
14. **End-to-end testing** - Full flow verification

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Time to complete new merchant profile | < 5 minutes |
| Data loss incidents | 0 |
| Mobile usability score | > 90 |
| Page load time | < 2 seconds |
| Auto-save reliability | 99.9% |
