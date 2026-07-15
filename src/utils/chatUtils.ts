export type GroupPosition = 'single' | 'first' | 'middle' | 'last'

export function groupMessages(history: any[]): { messages: any[]; groupPositions: GroupPosition[] }[] {
  const groups: { messages: any[]; groupPositions: GroupPosition[] }[] = []
  for (const msg of history) {
    const lastGroup = groups[groups.length - 1]
    const lastMsg = lastGroup?.messages?.at(-1)
    if (lastMsg && lastMsg.sender === msg.sender) {
      lastGroup.messages.push(msg)
    } else {
      groups.push({ messages: [msg], groupPositions: [] })
    }
  }
  for (const group of groups) {
    if (group.messages.length === 1) {
      group.groupPositions = ['single']
    } else {
      group.groupPositions = group.messages.map((_, i) => {
        if (i === 0) return 'first'
        if (i === group.messages.length - 1) return 'last'
        return 'middle'
      })
    }
  }
  return groups
}

export function formatDateLabel(timeStr: string): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (!match) return timeStr
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(match[1]), parseInt(match[2]))
  const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: now.getFullYear() !== d.getFullYear() ? 'numeric' : undefined })
}

export function fuzzTime(timeStr: string, id: number): string {
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (!match) return timeStr
  let h = parseInt(match[1])
  let m = parseInt(match[2])
  const offset = (id % 11) - 5
  m += offset
  if (m < 0) {
    m += 60
    h = (h - 1 + 24) % 24
  } else if (m >= 60) {
    m -= 60
    h = (h + 1) % 24
  }
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export function getBubbleCornerClass(gp: GroupPosition, isMe: boolean): string {
  if (isMe) {
    if (gp === 'single') return 'rounded-xl rounded-br-sm'
    if (gp === 'first') return 'rounded-t-xl rounded-bl-xl rounded-br-xl rounded-bl-sm'
    if (gp === 'middle') return 'rounded-l-xl rounded-r-xl rounded-br-xl rounded-bl-xl'
    if (gp === 'last') return 'rounded-tl-xl rounded-tr-xl rounded-br-sm rounded-bl-xl'
    return 'rounded-xl rounded-br-sm'
  } else {
    if (gp === 'single') return 'rounded-xl rounded-bl-sm'
    if (gp === 'first') return 'rounded-t-xl rounded-br-xl rounded-br-sm rounded-bl-xl'
    if (gp === 'middle') return 'rounded-r-xl rounded-l-xl rounded-bl-xl rounded-br-xl'
    if (gp === 'last') return 'rounded-tr-xl rounded-tl-xl rounded-bl-sm rounded-br-xl'
    return 'rounded-xl rounded-bl-sm'
  }
}
