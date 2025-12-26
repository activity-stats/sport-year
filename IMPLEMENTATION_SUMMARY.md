# Year in Review Implementation Summary

## Overview

This document summarizes the improvements implemented for the Year in Review feature based on user requirements.

## Implemented Features

### 1. ✅ Background Image Cropping/Positioning

**Description**: Added ability to crop and position the background image in the Year in Review hero section.

**Changes Made**:

- Created new `ImagePositionEditor` component (`src/components/ui/ImagePositionEditor.tsx`)
- Added `backgroundImagePosition` property to `YearInReviewSettings` interface with `x`, `y`, and `scale` values
- Updated `YearInReview` component to use dynamic background positioning based on user settings
- Added controls in `YearInReviewSettings` for:
  - Horizontal Position (0-100%)
  - Vertical Position (0-100%)
  - Zoom level (0.5x - 3x)
  - Reset to default button
- Added live preview of positioning changes

**Usage**:

1. Go to Year in Review Settings
2. Click on "Background" tab
3. Upload or set an image URL
4. Use the sliders to adjust position and zoom
5. Preview updates in real-time

### 2. ✅ Active Calories Burned Stat

**Description**: Added calories burned as a new stat option in the Year in Review hero section.

**Changes Made**:

- Added `calories` and `kilojoules` fields to `Activity` type
- Added `calories` and `kilojoules` to Strava API response type
- Updated `transformActivity` function to map calories from Strava API
- Added `calories` to the `StatType` union type
- Added calories calculation in `YearInReview` component
- Added "Calories Burned" option to `AVAILABLE_STATS` in settings store
- Users can now select "Calories Burned" in the Stats tab of Year in Review Settings

**Usage**:

1. Go to Year in Review Settings
2. Click on "Stats" tab
3. Check "Calories Burned" to include it in your year highlights
4. The stat will show total calories burned across all activities (if available from Strava)

### 3. ✅ Enable/Disable Activity Types

**Description**: Users can select which activity types to include in Year in Review.

**Status**: Already implemented and working

- Located in Year in Review Settings → "Activities" tab
- Select All / Deselect All buttons available
- Activities can be toggled individually

### 4. ✅ Drag-and-Drop for Sport Breakdown

**Description**: Ability to reorder sport activities in the detailed view.

**Status**: Already implemented in `SportBreakdownSettings` component

- Users can drag activities to reorder them
- Changes are saved when clicking "Save"
- Located in Sport Breakdown Settings

## Technical Details

### Store Updates (settingsStore.ts)

- Added `backgroundImagePosition: { x: number; y: number; scale: number }` to settings
- Added `setBackgroundImagePosition` action
- Added `calories` to stat types
- Incremented version to 3 with migration support for existing users

### Type Updates

- Added `calories?` and `kilojoules?` to `Activity` interface
- Added `calories?` and `kilojoules?` to `StravaActivity` interface
- Added `calories` to `StatType` union

### Component Updates

- `YearInReview.tsx`: Added calories calculation and background position support
- `YearInReviewSettings.tsx`: Integrated ImagePositionEditor
- `ImagePositionEditor.tsx`: New component for background image positioning

## Migration

The settings store includes automatic migration from version 2 to version 3:

- Existing users will automatically get default background position values (x: 50, y: 50, scale: 1)
- No data loss for existing settings

## Testing

✅ Build succeeded without errors
✅ Dev server starts successfully
✅ All TypeScript types compile correctly

## Next Steps

Users can now:

1. Upload custom background images and position them precisely
2. Include calories burned in their year highlights
3. Customize which activity types appear in their year review
4. Reorder sport activities in detailed view (existing feature)

## Notes

- Calories will only show if Strava provides this data for activities
- Background positioning is persisted across sessions
- All changes are stored in browser localStorage
- Maximum image size: 5MB
