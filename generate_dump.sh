#!/bin/bash

OUTPUT_FILE="codebase_dump.md"

# Clear the output file
> "$OUTPUT_FILE"

# Add header
echo "# Codebase Dump" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Generated on: $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Find all .tsx, .ts, and .css files in src/ and process them
find src -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.css" \) | sort | while read -r file; do
    echo "### File: $file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo '```typescript' >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

echo "✅ Codebase dump created: $OUTPUT_FILE"
