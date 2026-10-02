import type { MockCall } from '../../types/constants';

export const MOCK_CALLS: MockCall[] = [
  {
    id: 1,
    name: "Alice Freeman",
    time: "10:42 AM",
    type: "outgoing",
    duration: "5m 23s",
  },
  { id: 2, name: "+1 (555) 019-283", time: "Yesterday", type: "missed" },
  {
    id: 3,
    name: "Operations Team",
    time: "Yesterday",
    type: "incoming",
    duration: "12m 4s",
  },
  { id: 4, name: "Unknown", time: "Mon, 14:20", type: "missed" },
  {
    id: 5,
    name: "Bob Smith",
    time: "Sun, 08:15",
    type: "incoming",
    duration: "2m 10s",
  },
];
