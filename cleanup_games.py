#!/usr/bin/env python3
import re

with open('app.js', 'r') as f:
    content = f.read()

# Find the start of the junk block: anything between the two App Store headers
# The first one is a duplicate inserted accidentally, starting right after filterGames closes
# We want to remove everything between:
#   "// --- 10. iOS App Store Gallery Engine ---\n// ==========================================\n\n"
# (the FIRST occurrence) and
#   "async function initializeRealAppStore"

# Strategy: find the second occurrence of the App Store header and keep only that
marker = '// ==========================================\n// --- 10. iOS App Store Gallery Engine ---\n// ==========================================\n'
idx1 = content.find(marker)
idx2 = content.find(marker, idx1 + 1)

if idx1 != -1 and idx2 != -1:
    # Keep everything up to idx1, then jump to idx2
    content = content[:idx1] + content[idx2:]
    print(f"Removed duplicate block between positions {idx1} and {idx2}")
else:
    print(f"Markers found: first={idx1}, second={idx2}")
    print("Could not find both markers, no change made")

with open('app.js', 'w') as f:
    f.write(content)

print("Done.")
