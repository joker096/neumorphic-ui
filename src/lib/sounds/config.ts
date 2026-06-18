export type SoundEventType =
  | 'incoming-call'
  | 'call-ringing'
  | 'call-busy'
  | 'call-hang-up'
  | 'call-waiting'
  | 'incoming-chat'
  | 'incoming-sms'
  | 'incoming-file'
  | 'incoming-contact'
  | 'outgoing-message'
  | 'typing-indicator'
  | 'error'
  | 'contact-signs-in'
  | 'sign-out'
  | 'file-transfer-done'
  | 'birthday-reminder'
  | 'flip-window';

export const soundConfig: Record<SoundEventType, string> = {
  'incoming-call': '/ICQ/sound/zvuk-icq-incoming-call.mp3',
  'call-ringing': '/ICQ/sound/zvuk-icq-call-ringing.mp3',
  'call-busy': '/ICQ/sound/zvuk-icq-call-busy.mp3',
  'call-hang-up': '/ICQ/sound/zvuk-icq-call-hang-up.mp3',
  'call-waiting': '/ICQ/sound/zvuk-icq-call-waiting.mp3',
  'incoming-chat': '/ICQ/sound/zvuk-icq-novoe-soobshchenie.mp3',
  'incoming-sms': '/ICQ/sound/zvuk-icq-incoming-sms.mp3',
  'incoming-file': '/ICQ/sound/zvuk-icq-incoming-file.mp3',
  'incoming-contact': '/ICQ/sound/zvuk-icq-you-added-someone-to-your-list.mp3',
  'outgoing-message': '/ICQ/sound/zvuk-icq-outgoing-im_.mp3',
  'typing-indicator': '/ICQ/sound/zvuk-icq-typing-im.wav',
  'error': '/ICQ/sound/zvuk-icq-error-oshibka.wav',
  'contact-signs-in': '/ICQ/sound/zvuk-icq-contact-signs-in.wav',
  'sign-out': '/ICQ/sound/zvuk-icq-i-sign-out.mp3',
  'file-transfer-done': '/ICQ/sound/zvuk-icq-file-transfer-done.mp3',
  'birthday-reminder': '/ICQ/sound/zvuk-icq-birthday-reminder.mp3',
  'flip-window': '/ICQ/sound/zvuk-icq-flip-window-flipped.mp3',
};
