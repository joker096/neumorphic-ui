/**
 * JSON frame protocol for P2P chat messages.
 * Frames travel as raw string payloads over `p2pNetwork.broadcast()`.
 * The receiving peer's identity is the wire `BroadcastMessage.senderId`,
 * not a field inside the frame.
 *
 * The codecs live in three focused modules; this barrel keeps every existing
 * `lib/p2p/chatFrame` import working unchanged.
 */

export * from './chatFrameCore';
export * from './chatFrameInteraction';
export * from './chatFrameVoice';
