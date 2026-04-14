
#!/bin/bash

# Mapping for standardization
# Containers -> rounded-2xl
# Internal -> rounded-xl
# Buttons -> rounded-lg

# 1. Containers/Large Sections
# Use a loop to replace various custom rem values with rounded-2xl
for val in "1.75rem" "1.8rem" "1.85rem" "1.9rem" "2rem" "2.25rem" "1.6rem" "1.5rem" "1.45rem" "1.4rem" "30px" "34px" "28px" "26px" "24px"; do
  grep -rl "rounded-[$val]" /tmp/zolio-saas/src | xargs -r sed -i "s/rounded-[\[$val\]]/rounded-2xl/g"
done

# 2. Mid-level elements -> rounded-xl
for val in "1.15rem" "1.2rem" "1.25rem"; do
  grep -rl "rounded-[$val]" /tmp/zolio-saas/src | xargs -r sed -i "s/rounded-[\[$val\]]/rounded-xl/g"
done

# 3. Low-level elements -> rounded-lg
grep -rl "rounded-[1rem]" /tmp/zolio-saas/src | xargs -r sed -i "s/rounded-[\[1rem\]]/rounded-lg/g"

echo "Standardization complete."
