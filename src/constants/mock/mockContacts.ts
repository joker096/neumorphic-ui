import type { Contact } from '../../types/contact';

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact_001',
    name: 'Alice Freeman',
    color: 'from-pink-400 to-rose-400',
    lastSeen: Date.now() - 5 * 60 * 1000,
    isFavorite: true,
    telegram: '@alice_freeman',
    channelIds: ['channel_001'],
  },
  {
    id: 'contact_002',
    name: 'Bob Smith',
    color: 'from-blue-400 to-indigo-400',
    lastSeen: Date.now() - 30 * 60 * 1000,
    telegram: '@bob_smith',
    channelIds: ['channel_002'],
  },
  {
    id: 'contact_003',
    name: 'Victor Chen',
    color: 'from-indigo-400 to-cyan-400',
    lastSeen: Date.now() - 2 * 60 * 60 * 1000,
    isBlocked: false,
    telegram: '@victor_chen',
  },
  {
    id: 'contact_004',
    name: 'Diana Ross',
    color: 'from-purple-400 to-fuchsia-400',
    lastSeen: Date.now() - 10 * 60 * 1000,
    isFavorite: true,
    telegram: '@diana_ross',
  },
  {
    id: 'contact_005',
    name: 'Charlie Wilson',
    color: 'from-amber-400 to-orange-400',
    lastSeen: Date.now() - 5 * 60 * 60 * 1000,
    whatsapp: '+1 (555) 123-4567',
  },
  {
    id: 'contact_006',
    name: 'Eve Martinez',
    color: 'from-teal-400 to-emerald-400',
    lastSeen: Date.now() - 1 * 60 * 1000,
    signal: '+1 (555) 987-6543',
  },
];
