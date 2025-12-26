#!/bin/bash

# Dark Mode Update Script
# This script adds dark mode classes to all component files

cd "$(dirname "$0")"

# List of files to update
files=(
  "src/components/charts/ActivityTypeChart.tsx"
  "src/components/charts/HeatmapCalendar.tsx"
  "src/components/charts/AchievementTimeline.tsx"
  "src/components/ui/ActivityBreakdownCard.tsx"
  "src/components/ui/LoadingProgress.tsx"
  "src/components/ui/OnboardingGuide.tsx"
  "src/components/ui/YearInReviewSettings.tsx"
  "src/components/ui/StatsSelector.tsx"
  "src/components/ui/SocialCard.tsx"
  "src/components/settings/StravaSettings.tsx"
  "src/components/settings/SportBreakdownSettings.tsx"
  "src/components/ui/AdvancedFilters.tsx"
  "src/components/activities/ActivityList.tsx"
)

# Common dark mode replacements
declare -A replacements=(
  ["className=\"bg-white rounded"]="className=\"bg-white dark:bg-gray-800 rounded"
  ["className=\"bg-white shadow"]="className=\"bg-white dark:bg-gray-800 shadow"
  ["className=\"bg-white border"]="className=\"bg-white dark:bg-gray-800 border"
  ["className=\"bg-white p-"]="className=\"bg-white dark:bg-gray-800 p-"
  ["bg-white "]="bg-white dark:bg-gray-800 "
  [" text-gray-900 "]=" text-gray-900 dark:text-white "
  [" text-gray-800 "]=" text-gray-800 dark:text-gray-100 "
  [" text-gray-700 "]=" text-gray-700 dark:text-gray-300 "
  [" text-gray-600 "]=" text-gray-600 dark:text-gray-400 "
  [" text-gray-500 "]=" text-gray-500 dark:text-gray-400 "
  [" border-gray-100 "]=" border-gray-100 dark:border-gray-700 "
  [" border-gray-200 "]=" border-gray-200 dark:border-gray-600 "
  [" border-gray-300 "]=" border-gray-300 dark:border-gray-600 "
  [" bg-gray-50 "]=" bg-gray-50 dark:bg-gray-900 "
  [" bg-gray-100 "]=" bg-gray-100 dark:bg-gray-800 "
  ["bg-gray-50 "]="bg-gray-50 dark:bg-gray-900 "
  ["bg-gray-100 "]="bg-gray-100 dark:bg-gray-800 "
)

echo "Starting dark mode updates..."

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."

    # Create backup
    cp "$file" "${file}.bak"

    # Apply replacements
    for pattern in "${!replacements[@]}"; do
      replacement="${replacements[$pattern]}"
      # Use perl for more reliable replacements
      perl -i -pe "s/\Q$pattern\E/$replacement/g" "$file" 2>/dev/null || true
    done

    echo "✓ Updated $file"
  else
    echo "✗ File not found: $file"
  fi
done

echo ""
echo "Dark mode updates complete!"
echo "Backup files created with .bak extension"
echo "Review changes and remove backups with: find src -name '*.bak' -delete"
