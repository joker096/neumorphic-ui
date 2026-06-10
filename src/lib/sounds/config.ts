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
  'incoming-call': '/zvuk-icq-incoming-call.mp3',
  'call-ringing': '/zvuk-icq-call-ringing.mp3',
  'call-busy': '/zvuk-icq-call-busy.mp3',
  'call-hang-up': '/zvuk-icq-call-hang-up.mp3',
  'call-waiting': '/zvuk-icq-call-waiting.mp3',
  'incoming-chat': '/zvuk-icq-novoe-soobshchenie.mp3',
  'incoming-sms': '/zvuk-icq-incoming-sms.mp3',
  'incoming-file': '/zvuk-icq-incoming-file.mp3',
  'incoming-contact': '/zvuk-icq-you-added-someone-to-your-list.mp3',
  'outgoing-message': '/zvuk-icq-outgoing-im_.mp3',
  'typing-indicator': '/zvuk-icq-typing-im.wav',
  'error': '/zvuk-icq-error-oshibka.wav',
  'contact-signs-in': '/zvuk-icq-contact-signs-in.wav',
  'sign-out': '/zvuk-icq-i-sign-out.mp3',
  'file-transfer-done': '/zvuk-icq-file-transfer-done.mp3',
  'birthday-reminder': '/zvuk-icq-birthday-reminder.mp3',
  'flip-window': '/zvuk-icq-flip-window-flipped.mp3',
};
