import re
import sys

with open(r'src\components\ContactCreateEditModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace hex colors (bg-[#1a1d24] and bg-[#13151b])
content = content.replace('bg-[#1a1d24]', 'bg-[var(--bg-secondary)]')
content = content.replace('bg-[#13151b]', 'bg-[var(--bg-secondary)]')

# 2. Replace border-white patterns (dark theme)
content = content.replace('border-white/10', 'border-[var(--border-color)]/10')
content = content.replace('border-white/5', 'border-[var(--border-color)]')

# 3. Replace border-black patterns (light theme)
content = content.replace('border-black/10', 'border-[var(--border-color)]/10')
content = content.replace('border-black/5', 'border-[var(--border-color)]/10')

# 4. Replace focus:border-orange-500
content = content.replace('focus:border-orange-500', 'focus:border-[var(--color-warning)]')

# 5. Replace bg-white/10 (dark base)
content = content.replace('bg-white/10', 'bg-[var(--bg-tertiary)]/10')

# 6. Replace hover:bg-white/20 (dark hover)
content = content.replace('hover:bg-white/20', 'hover:bg-[var(--bg-tertiary)]/20')

# 7. Replace bg-black/5 (light base)
content = content.replace('bg-black/5', 'bg-[var(--bg-tertiary)]/10')

# 8. Replace hover:bg-white/5 (dark hover for tag buttons)
content = content.replace('hover:bg-white/5', 'hover:bg-[var(--bg-tertiary)]/10')

# 9. Replace hover:bg-black/5 (light hover for tag buttons)
content = content.replace('hover:bg-black/5', 'hover:bg-[var(--bg-tertiary)]/10')

# 10. Replace hover:bg-black/10 (light hover for close button)
content = content.replace('hover:bg-black/10', 'hover:bg-[var(--bg-tertiary)]/10')

# 11. Replace text-white (standalone, not text-white/50)
content = content.replace('text-white"', 'text-[var(--text-primary)]"')
content = content.replace('text-white}', 'text-[var(--text-primary)]}')

# 12. Replace text-white/50 (disabled state)
content = content.replace('text-white/50', 'text-[var(--text-primary)]/50')

with open(r'src\components\ContactCreateEditModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
