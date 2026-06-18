import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', 'src', 'locales');

// Read en.json as source of truth
const enJson = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'));

// All missing keys grouped by section with their English values
const missingSections = {
  chat: {
    archived: 'Archived',
    createBot: 'Create Bot',
    createChannel: 'Create Channel',
    endCall: 'End Call',
    folders: {
      all: 'All',
      archived: 'Archived',
      personal: 'Personal',
      unread: 'Unread',
      work: 'Work'
    },
    goBack: 'Go Back',
    mute: 'Mute',
    searchBotsPlaceholder: 'Search bots or services...',
    searchChannelsPlaceholder: 'Search channels...',
    searchPlaceholder: 'Search chats or messages...',
    sectionBots: 'My Bots',
    sectionChannels: 'Channels',
    sectionConversations: 'Conversations',
    tabs: {
      bots: 'Bots',
      channels: 'Channels',
      chats: 'Chats',
      stories: 'Stories'
    },
    unmute: 'Unmute',
    all: 'All',
    clear: 'Clear',
    clearChatHistory: 'Clear Chat History',
    contact: 'Contact',
    e2eEncrypted: 'E2E Encrypted',
    filters: {
      all: 'All',
      apply: 'Apply',
      button: 'Filters',
      buttonOn: 'Filters ON',
      clear: 'Clear',
      clearHistory: 'Clear Chat History',
      from: 'From',
      fromBots: 'From Bots',
      hasAudio: 'Has Voice Notes',
      hasMedia: 'Has Media',
      hasReplies: 'Has Replies',
      items: '{count} items',
      me: 'Me',
      mediaTabs: {
        all: 'Media',
        audio: 'Voice notes',
        links: 'Links',
        photos: 'Photos'
      },
      muteChannel: 'Mute Channel',
      offline: 'Offline',
      online: 'Online',
      others: 'Others',
      photo: 'Photo',
      priority: 'Priority',
      ready: 'ready',
      reset: 'Reset',
      searchMessages: 'Search Messages',
      searchPlaceholder: 'Search in chat...',
      startVideoCall: 'Start Video Call',
      title: 'Advanced Filters',
      to: 'to',
      unmuteChannel: 'Unmute Channel',
      voiceNote: 'Voice note'
    },
    from: 'From:',
    items: '{{count}} items',
    linkPreview: 'Link Preview',
    links: 'Links',
    me: 'Me',
    media: 'Media',
    mediaAlt: 'media',
    message: 'Message',
    moreEmoji: 'More emoji',
    morePinned: '+{{n}} more pinned',
    nSaved: '{{n}} saved',
    noOneYet: 'No one yet',
    noSavedMessages: 'No saved messages yet',
    offline: 'Offline',
    online: 'Online',
    others: 'Others',
    photo: 'Photo',
    photos: 'Photos',
    pin: 'Pin',
    pinned: 'Pinned',
    pinnedVoice: '\uD83C\uDFB5 Voice',
    reactedBy: 'Reacted by',
    ready: 'ready',
    repliesLabel: 'replies',
    reply: 'Reply',
    replyLabel: 'reply',
    save: 'Save',
    saved: 'Saved',
    savedItems: '{{n}} items in {{chatName}}',
    savedMessagesHint: 'Long-press a message and tap Bookmark to save',
    searchInChat: 'Search in chat...',
    searchMessages: 'Search Messages',
    selfDestructActive: 'Self-destruct active (1h)',
    sharedAlt: 'Shared',
    startAudioCall: 'Start Audio Call',
    startVideoCall: 'Start Video Call',
    to: 'to',
    unknownCall: 'Unknown Call',
    unpin: 'Unpin',
    unsave: 'Unsave',
    videoThumbnailAlt: 'Video thumbnail',
    voiceNoteLabel: 'Voice note',
    voiceNotes: 'Voice notes',
    you: 'You'
  },
  comments: {
    leaveComment: 'Leave a Comment'
  },
  common: {
    accounts: 'Accounts',
    ad: 'AD',
    addAccount: 'Add Account',
    newAccountName: 'New Account Name...',
    sponsored: 'sponsored',
    you: 'You'
  },
  contacts: {
    addDetailsHint: 'Enter their name and unique network ID to establish a connection.',
    addField: 'Add Field',
    editDetailsHint: 'Update contact details below.',
    fieldTypeCustom: 'Custom',
    fieldTypeEmail: 'Email',
    fieldTypePhone: 'Phone',
    fieldTypeSignal: 'Signal',
    fieldTypeTelegram: 'Telegram',
    fieldTypeWhatsapp: 'WhatsApp',
    fieldSubtypeHome: 'Home',
    fieldSubtypeMain: 'Main',
    fieldSubtypeMobile: 'Mobile',
    fieldSubtypeWork: 'Work',
    localFieldsNotShared: 'Not shared when sharing contact',
    localInfo: 'Local Info',
    noLocalFields: 'No local fields. Add phone, email, Telegram, or custom data.',
    phoneSubtypeHome: 'Home',
    phoneSubtypeMain: 'Main',
    phoneSubtypeMobile: 'Mobile',
    phoneSubtypeWork: 'Work',
    validationRequired: 'Please fill in both fields'
  },
  emoji: {
    noIcqFound: 'No ICQ emojis found',
    noRecent: 'No recent emojis yet'
  },
  lock: {
    enterPin: 'Enter PIN',
    invalidPin: 'Invalid PIN'
  },
  media: {
    fullView: 'Full view',
    p2pEncrypted: 'P2P Encrypted Media'
  },
  player: {
    systemPlayer: 'SYSTEM PLAYER',
    audioSettings: 'Audio Settings',
    masterVolume: 'Master Volume',
    equalizer: '5-Band Equalizer',
    resetEq: 'Reset EQ',
    noTracks: 'No Tracks',
    radioLink: 'RADIO LINK',
    localTrack: 'LOCAL TRACK',
    radioStations: 'Radio Stations',
    systemPlaylist: 'System Playlist',
    addRadioStation: 'Add Radio Station',
    stationName: 'Station Name',
    stationNamePlaceholder: 'e.g. MetroPulse FM',
    streamUrl: 'Stream URL',
    streamUrlPlaceholder: 'https://stream.example.com/live',
    nameRequired: 'Name is required',
    urlRequired: 'URL is required',
    urlInvalid: 'URL must start with http:// or https://',
    addStation: 'Add Station',
    cancel: 'Cancel',
    deleteConfirm: 'Delete {name}?',
    switchToLocal: 'Switch to Local Playlist',
    switchToRadio: 'Switch to Radio Player',
    previousTrack: 'Previous Track',
    nextTrack: 'Next Track',
    backToPlayer: 'Back to Player',
    addTrack: 'Add Track',
    addFolder: 'Add Folder',
    addVideo: 'Add Video',
    remove: 'Remove',
    unmute: 'Unmute',
    mute: 'Mute',
    pause: 'Pause',
    play: 'Play',
    hidePlaylist: 'Hide Playlist',
    viewPlaylist: 'View Playlist',
    equalizerSettings: 'Equalizer & Settings',
    eqPresetFlat: 'Flat',
    eqPresetBassBoost: 'Bass Boost',
    eqPresetTrebleBoost: 'Treble Boost',
    eqPresetVocal: 'Vocal',
    eqPresetRock: 'Rock',
    eqPresetPop: 'Pop',
    eqPresetJazz: 'Jazz',
    eqPresetClassical: 'Classical',
    eqPresetPhonograph: 'Phonograph',
    eqPresetBassReducesHighs: 'Bass Reduces Highs',
    eqDescFlat: 'Flat response',
    eqDescBassBoost: 'Enhanced bass',
    eqDescTrebleBoost: 'Enhanced treble',
    eqDescVocal: 'Vocals emphasis',
    eqDescRock: 'Rock music preset',
    eqDescPop: 'Pop music preset',
    eqDescJazz: 'Jazz music preset',
    eqDescClassical: 'Classical music preset',
    eqDescPhonograph: 'Vintage phonograph sound',
    eqDescBassReducesHighs: 'Bass boost with reduced highs',
    customPreset: 'Custom preset',
    videoLoaded: 'Video loaded',
    invalidFile: 'Invalid file',
    selectVideoFile: 'Please select a video file',
    appliedPreset: 'Applied: {name}',
    enterPresetName: 'Please enter a name for your preset',
    presetSaved: 'Preset saved!',
    presetSaveFailed: 'Failed to save preset',
    presetDeleted: 'Preset deleted',
    noMediaFound: 'No media files found in folder'
  },
  settings: {
    defaultUserHandle: '@joker',
    defaultUsername: 'Joker',
    icqEmojiSkin: 'ICQ Emoji Skin',
    networkSubtitle: 'Network settings sub-view',
    privacySubView: 'Privacy settings sub-view',
    forwardPrivacy: 'Forward Privacy',
    proxyUrl: 'Proxy URL',
    proxyUrlSubtitle: 'SOCKS5 proxy address',
    recoveryPhrase: 'Recovery Phrase',
    recoveryPhraseGenerated: 'Recovery phrase generated ✓',
    recoveryPhraseInvalid: 'Invalid or incorrect phrase',
    recoveryPhraseIveSavedIt: "I've Saved It",
    recoveryPhraseRestoreSubtitle: 'Enter your 10-word recovery phrase to restore your data.',
    recoveryPhraseRestoreTitle: 'Restore from Recovery Phrase',
    recoveryPhraseRestoring: 'Restoring...',
    recoveryPhraseSubtitle: 'Generate backup recovery phrase',
    recoveryPhraseSuccess: 'Restoration successful!',
    recoveryPhraseWriteDown: 'Write this down and store it safely. This is the only way to recover your data.',
    torBridge: 'Tor Bridge',
    torBridgeSubtitle: 'Bridges help circumvent censorship'
  },
  stickers: {
    all: 'All',
    animals: 'Animals',
    default: 'Default',
    emoji: 'Emoji',
    food: 'Food',
    icq: 'ICQ',
    nature: 'Nature',
    searchPlaceholder: 'Search stickers...'
  },
  voiceRecorder: {
    discard: 'Discard',
    micBlocked: 'Microphone access is blocked. Please allow microphone permissions and try again.',
    pause: 'Pause',
    play: 'Play',
    preview: 'Voice note preview',
    rerecord: 'Re-record',
    resume: 'Resume',
    seek: 'Seek voice note',
    send: 'Send',
    stopAndSend: 'Stop and Send'
  }
};

// Translations for locales that need them
const translations = {
  de: {
    chat: {
      all: 'Alle', clear: 'Löschen', clearChatHistory: 'Chatverlauf löschen',
      contact: 'Kontakt', e2eEncrypted: 'E2E verschlüsselt', filters: 'Filter',
      filtersOn: 'Filter EIN', from: 'Von:', items: '{{count}} Elemente',
      linkPreview: 'Linkvorschau', links: 'Links', me: 'Mir',
      media: 'Medien', mediaAlt: 'Medien', message: 'Nachricht',
      moreEmoji: 'Mehr Emojis', morePinned: '+{{n}} weitere angepinnt',
      nSaved: '{{n}} gespeichert', noOneYet: 'Noch niemand',
      noSavedMessages: 'Noch keine gespeicherten Nachrichten',
      offline: 'Offline', online: 'Online', others: 'Andere',
      photo: 'Foto', photos: 'Fotos', pin: 'Anpinnen',
      pinned: 'Angepinnt', pinnedVoice: '\uD83C\uDFB5 Sprachnachricht',
      reactedBy: 'Reagiert von', ready: 'bereit',
      repliesLabel: 'Antworten', reply: 'Antworten', replyLabel: 'Antwort',
      save: 'Speichern', saved: 'Gespeichert',
      savedItems: '{{n}} Elemente in {{chatName}}',
      savedMessagesHint: 'Drücke lange auf eine Nachricht und tippe auf Lesezeichen zum Speichern',
      searchInChat: 'Im Chat suchen...',
      searchMessages: 'Nachrichten, Personen suchen...',
      selfDestructActive: 'Selbstzerstörung aktiv (1h)',
      sharedAlt: 'Geteilt', startAudioCall: 'Audioanruf starten',
      startVideoCall: 'Videoanruf starten', to: 'bis',
      unknownCall: 'Unbekannter Anruf', unpin: 'Lösen',
      unsave: 'Entfernen', videoThumbnailAlt: 'Videominiatur',
      voiceNoteLabel: 'Sprachnachricht', voiceNotes: 'Sprachnachrichten',
      you: 'Du'
    },
    comments: { leaveComment: 'Kommentar hinterlassen' },
    common: {
      accounts: 'Konten', ad: 'ANZEIGE', addAccount: 'Konto hinzufügen',
      newAccountName: 'Neuer Kontoname...', sponsored: 'gesponsert', you: 'Du'
    },
    contacts: {
      addDetailsHint: 'Gib Namen und eindeutige Netzwerk-ID ein, um eine Verbindung herzustellen.',
      editDetailsHint: 'Aktualisiere die Kontaktdaten unten.',
      fieldTypeCustom: 'Benutzerdefiniert', fieldTypeEmail: 'E-Mail',
      fieldTypePhone: 'Telefon', fieldTypeSignal: 'Signal',
      fieldTypeTelegram: 'Telegram', fieldTypeWhatsapp: 'WhatsApp',
      phoneSubtypeHome: 'Privat', phoneSubtypeMain: 'Hauptnummer',
      phoneSubtypeMobile: 'Mobil', phoneSubtypeWork: 'Arbeit',
      validationRequired: 'Bitte fülle beide Felder aus'
    },
    emoji: { noIcqFound: 'Keine ICQ-Emojis gefunden', noRecent: 'Noch keine aktuellen Emojis' },
    lock: { enterPin: 'PIN eingeben', invalidPin: 'Ungültige PIN' },
    media: { fullView: 'Vollansicht', p2pEncrypted: 'P2P-verschlüsselte Medien' },
    player: {
      systemPlayer: 'SYSTEMPLAYER', audioSettings: 'Audioeinstellungen',
      masterVolume: 'Hauptlautstärke', equalizer: '5-Band Equalizer',
      resetEq: 'EQ zurücksetzen', noTracks: 'Keine Titel',
      radioLink: 'RADIOLINK', localTrack: 'LOKALER TITEL',
      radioStations: 'Radiosender', systemPlaylist: 'System-Playlist',
      addRadioStation: 'Radiosender hinzufügen', stationName: 'Sendername',
      stationNamePlaceholder: 'z.B. MetroPulse FM', streamUrl: 'Stream-URL',
      streamUrlPlaceholder: 'https://stream.example.com/live',
      nameRequired: 'Name ist erforderlich', urlRequired: 'URL ist erforderlich',
      urlInvalid: 'URL muss mit http:// oder https:// beginnen',
      addStation: 'Sender hinzufügen', cancel: 'Abbrechen',
      deleteConfirm: '{name} löschen?',
      switchToLocal: 'Zu lokaler Playlist wechseln',
      switchToRadio: 'Zum Radioplayer wechseln',
      previousTrack: 'Vorheriger Titel', nextTrack: 'Nächster Titel',
      backToPlayer: 'Zurück zum Player', addTrack: 'Titel hinzufügen',
      addFolder: 'Ordner hinzufügen', addVideo: 'Video hinzufügen',
      remove: 'Entfernen', unmute: 'Stummschaltung aufheben', mute: 'Stummschalten',
      pause: 'Pause', play: 'Abspielen', hidePlaylist: 'Playlist ausblenden',
      viewPlaylist: 'Playlist anzeigen',
      equalizerSettings: 'Equalizer & Einstellungen',
      eqPresetFlat: 'Flach', eqPresetBassBoost: 'Bass Boost',
      eqPresetTrebleBoost: 'Höhen Boost', eqPresetVocal: 'Gesang',
      eqPresetRock: 'Rock', eqPresetPop: 'Pop', eqPresetJazz: 'Jazz',
      eqPresetClassical: 'Klassik', eqPresetPhonograph: 'Phonograph',
      eqPresetBassReducesHighs: 'Bass reduziert Höhen',
      eqDescFlat: 'Neutraler Klang', eqDescBassBoost: 'Verstärkter Bass',
      eqDescTrebleBoost: 'Verstärkte Höhen', eqDescVocal: 'Stimmbetont',
      eqDescRock: 'Rock-Musik Preset', eqDescPop: 'Pop-Musik Preset',
      eqDescJazz: 'Jazz-Musik Preset', eqDescClassical: 'Klassik Preset',
      eqDescPhonograph: 'Vintage Phonograph Klang',
      eqDescBassReducesHighs: 'Bass mit reduzierten Höhen',
      customPreset: 'Benutzerdefiniertes Preset',
      videoLoaded: 'Video geladen', invalidFile: 'Ungültige Datei',
      selectVideoFile: 'Bitte wähle eine Videodatei aus',
      appliedPreset: 'Angewandt: {name}',
      enterPresetName: 'Bitte gib einen Namen für dein Preset ein',
      presetSaved: 'Preset gespeichert!',
      presetSaveFailed: 'Preset konnte nicht gespeichert werden',
      presetDeleted: 'Preset gelöscht',
      noMediaFound: 'Keine Mediendateien im Ordner gefunden'
    },
    settings: {
      defaultUserHandle: '@joker', defaultUsername: 'Joker',
      icqEmojiSkin: 'ICQ Emoji Skin', networkSubtitle: 'Netzwerkeinstellungen',
      privacySubView: 'Datenschutzeinstellungen',
      forwardPrivacy: 'Datenschutz beim Weiterleiten'
    },
    voiceRecorder: {
      discard: 'Verwerfen',
      micBlocked: 'Mikrofonzugriff blockiert. Bitte Mikrofonberechtigungen erlauben.',
      pause: 'Pause', play: 'Abspielen', preview: 'Sprachnachricht Vorschau',
      rerecord: 'Erneut aufnehmen', resume: 'Fortsetzen',
      seek: 'Sprachnachricht suchen', send: 'Senden',
      stopAndSend: 'Stoppen und Senden'
    }
  },
  es: {
    chat: {
      all: 'Todos', clear: 'Limpiar', clearChatHistory: 'Borrar historial del chat',
      contact: 'Contacto', e2eEncrypted: 'Cifrado E2E', filters: 'Filtros',
      filtersOn: 'Filtros ACTIVADOS', from: 'De:', items: '{{count}} elementos',
      linkPreview: 'Vista previa del enlace', links: 'Enlaces', me: 'Yo',
      media: 'Multimedia', mediaAlt: 'multimedia', message: 'Mensaje',
      moreEmoji: 'Más emojis', morePinned: '+{{n}} más fijados',
      nSaved: '{{n}} guardados', noOneYet: 'Nadie aún',
      noSavedMessages: 'Aún no hay mensajes guardados',
      offline: 'Desconectado', online: 'En línea', others: 'Otros',
      photo: 'Foto', photos: 'Fotos', pin: 'Fijar',
      pinned: 'Fijado', pinnedVoice: '\uD83C\uDFB5 Voz',
      reactedBy: 'Reaccionado por', ready: 'listo',
      repliesLabel: 'respuestas', reply: 'Responder', replyLabel: 'respuesta',
      save: 'Guardar', saved: 'Guardado',
      savedItems: '{{n}} elementos en {{chatName}}',
      savedMessagesHint: 'Mantén presionado un mensaje y toca Marcador para guardar',
      searchInChat: 'Buscar en el chat...',
      searchMessages: 'Buscar mensajes, personas...',
      selfDestructActive: 'Autodestrucción activa (1h)',
      sharedAlt: 'Compartido', startAudioCall: 'Iniciar llamada de audio',
      startVideoCall: 'Iniciar videollamada', to: 'a',
      unknownCall: 'Llamada desconocida', unpin: 'Desfijar',
      unsave: 'Eliminar guardado', videoThumbnailAlt: 'Miniatura de vídeo',
      voiceNoteLabel: 'Nota de voz', voiceNotes: 'Notas de voz',
      you: 'Tú'
    },
    comments: { leaveComment: 'Dejar un comentario' },
    common: {
      accounts: 'Cuentas', ad: 'ANUNCIO', addAccount: 'Añadir cuenta',
      newAccountName: 'Nuevo nombre de cuenta...', sponsored: 'patrocinado', you: 'Tú'
    },
    contacts: {
      addDetailsHint: 'Ingresa su nombre y ID de red única para establecer una conexión.',
      editDetailsHint: 'Actualiza los detalles del contacto abajo.',
      fieldTypeCustom: 'Personalizado', fieldTypeEmail: 'Correo electrónico',
      fieldTypePhone: 'Teléfono', fieldTypeSignal: 'Signal',
      fieldTypeTelegram: 'Telegram', fieldTypeWhatsapp: 'WhatsApp',
      phoneSubtypeHome: 'Casa', phoneSubtypeMain: 'Principal',
      phoneSubtypeMobile: 'Móvil', phoneSubtypeWork: 'Trabajo',
      validationRequired: 'Por favor rellena ambos campos'
    },
    emoji: { noIcqFound: 'No se encontraron emojis ICQ', noRecent: 'Aún no hay emojis recientes' },
    lock: { enterPin: 'Ingresar PIN', invalidPin: 'PIN inválido' },
    media: { fullView: 'Vista completa', p2pEncrypted: 'Medios cifrados P2P' },
    player: {
      systemPlayer: 'REPRODUCTOR DEL SISTEMA', audioSettings: 'Configuración de audio',
      masterVolume: 'Volumen principal', equalizer: 'Ecualizador de 5 bandas',
      resetEq: 'Restablecer EQ', noTracks: 'Sin pistas',
      radioLink: 'ENLACE DE RADIO', localTrack: 'PISTA LOCAL',
      radioStations: 'Emisoras de radio', systemPlaylist: 'Lista de reproducción del sistema',
      addRadioStation: 'Añadir emisora de radio', stationName: 'Nombre de la emisora',
      stationNamePlaceholder: 'ej. MetroPulse FM', streamUrl: 'URL del stream',
      streamUrlPlaceholder: 'https://stream.example.com/live',
      nameRequired: 'El nombre es obligatorio', urlRequired: 'La URL es obligatoria',
      urlInvalid: 'La URL debe comenzar con http:// o https://',
      addStation: 'Añadir emisora', cancel: 'Cancelar',
      deleteConfirm: '¿Eliminar {name}?',
      switchToLocal: 'Cambiar a lista de reproducción local',
      switchToRadio: 'Cambiar a reproductor de radio',
      previousTrack: 'Pista anterior', nextTrack: 'Siguiente pista',
      backToPlayer: 'Volver al reproductor', addTrack: 'Añadir pista',
      addFolder: 'Añadir carpeta', addVideo: 'Añadir vídeo',
      remove: 'Eliminar', unmute: 'Reactivar sonido', mute: 'Silenciar',
      pause: 'Pausa', play: 'Reproducir', hidePlaylist: 'Ocultar lista',
      viewPlaylist: 'Ver lista', equalizerSettings: 'Ecualizador y ajustes',
      eqPresetFlat: 'Plano', eqPresetBassBoost: 'Refuerzo de graves',
      eqPresetTrebleBoost: 'Refuerzo de agudos', eqPresetVocal: 'Vocal',
      eqPresetRock: 'Rock', eqPresetPop: 'Pop', eqPresetJazz: 'Jazz',
      eqPresetClassical: 'Clásica', eqPresetPhonograph: 'Fonógrafo',
      eqPresetBassReducesHighs: 'Graves reducen agudos',
      eqDescFlat: 'Respuesta plana', eqDescBassBoost: 'Graves mejorados',
      eqDescTrebleBoost: 'Agudos mejorados', eqDescVocal: 'Énfasis vocal',
      eqDescRock: 'Preset de rock', eqDescPop: 'Preset de pop',
      eqDescJazz: 'Preset de jazz', eqDescClassical: 'Preset de clásica',
      eqDescPhonograph: 'Sonido de fonógrafo vintage',
      eqDescBassReducesHighs: 'Graves con agudos reducidos',
      customPreset: 'Preset personalizado',
      videoLoaded: 'Vídeo cargado', invalidFile: 'Archivo inválido',
      selectVideoFile: 'Selecciona un archivo de vídeo',
      appliedPreset: 'Aplicado: {name}',
      enterPresetName: 'Ingresa un nombre para tu preset',
      presetSaved: '¡Preset guardado!',
      presetSaveFailed: 'Error al guardar el preset',
      presetDeleted: 'Preset eliminado',
      noMediaFound: 'No se encontraron archivos multimedia en la carpeta'
    },
    settings: {
      defaultUserHandle: '@joker', defaultUsername: 'Joker',
      icqEmojiSkin: 'Piel de emoji ICQ', networkSubtitle: 'Subvista de configuración de red',
      privacySubView: 'Subvista de configuración de privacidad',
      forwardPrivacy: 'Privacidad de reenvío'
    },
    voiceRecorder: {
      discard: 'Descartar',
      micBlocked: 'El acceso al micrófono está bloqueado. Permite los permisos del micrófono.',
      pause: 'Pausa', play: 'Reproducir', preview: 'Vista previa de nota de voz',
      rerecord: 'Regrabar', resume: 'Reanudar',
      seek: 'Buscar nota de voz', send: 'Enviar',
      stopAndSend: 'Detener y enviar'
    }
  },
  fr: {
    chat: {
      all: 'Tous', clear: 'Effacer', clearChatHistory: 'Effacer l\'historique',
      contact: 'Contact', e2eEncrypted: 'Chiffré E2E', filters: 'Filtres',
      filtersOn: 'Filtres ACTIFS', from: 'De :', items: '{{count}} éléments',
      linkPreview: 'Aperçu du lien', links: 'Liens', me: 'Moi',
      media: 'Médias', mediaAlt: 'médias', message: 'Message',
      moreEmoji: 'Plus d\'emoji', morePinned: '+{{n}} épinglés supplémentaires',
      nSaved: '{{n}} enregistrés', noOneYet: 'Personne encore',
      noSavedMessages: 'Aucun message enregistré',
      offline: 'Hors ligne', online: 'En ligne', others: 'Autres',
      photo: 'Photo', photos: 'Photos', pin: 'Épingler',
      pinned: 'Épinglé', pinnedVoice: '\uD83C\uDFB5 Voix',
      reactedBy: 'Réagi par', ready: 'prêt',
      repliesLabel: 'réponses', reply: 'Répondre', replyLabel: 'réponse',
      save: 'Enregistrer', saved: 'Enregistré',
      savedItems: '{{n}} éléments dans {{chatName}}',
      savedMessagesHint: 'Appuie longuement sur un message et tape Signet pour enregistrer',
      searchInChat: 'Rechercher dans le chat...',
      searchMessages: 'Rechercher messages, personnes...',
      selfDestructActive: 'Auto-destruction active (1h)',
      sharedAlt: 'Partagé', startAudioCall: 'Démarrer appel audio',
      startVideoCall: 'Démarrer appel vidéo', to: 'à',
      unknownCall: 'Appel inconnu', unpin: 'Désépingler',
      unsave: 'Supprimer', videoThumbnailAlt: 'Miniature vidéo',
      voiceNoteLabel: 'Message vocal', voiceNotes: 'Messages vocaux',
      you: 'Vous'
    },
    comments: { leaveComment: 'Laisser un commentaire' },
    common: {
      accounts: 'Comptes', ad: 'PUB', addAccount: 'Ajouter un compte',
      newAccountName: 'Nouveau nom de compte...', sponsored: 'sponsorisé', you: 'Vous'
    },
    contacts: {
      addDetailsHint: 'Saisis son nom et son ID réseau unique pour établir une connexion.',
      editDetailsHint: 'Mets à jour les coordonnées ci-dessous.',
      fieldTypeCustom: 'Personnalisé', fieldTypeEmail: 'E-mail',
      fieldTypePhone: 'Téléphone', fieldTypeSignal: 'Signal',
      fieldTypeTelegram: 'Telegram', fieldTypeWhatsapp: 'WhatsApp',
      phoneSubtypeHome: 'Domicile', phoneSubtypeMain: 'Principal',
      phoneSubtypeMobile: 'Mobile', phoneSubtypeWork: 'Travail',
      validationRequired: 'Veuillez remplir les deux champs'
    },
    emoji: { noIcqFound: 'Aucun emoji ICQ trouvé', noRecent: 'Aucun emoji récent' },
    lock: { enterPin: 'Saisir le PIN', invalidPin: 'PIN invalide' },
    media: { fullView: 'Plein écran', p2pEncrypted: 'Médias chiffrés P2P' },
    player: {
      systemPlayer: 'LECTEUR SYSTÈME', audioSettings: 'Paramètres audio',
      masterVolume: 'Volume principal', equalizer: 'Égaliseur 5 bandes',
      resetEq: 'Réinitialiser l\'EQ', noTracks: 'Aucune piste',
      radioLink: 'LIEN RADIO', localTrack: 'PISTE LOCALE',
      radioStations: 'Stations radio', systemPlaylist: 'Playlist système',
      addRadioStation: 'Ajouter une station radio', stationName: 'Nom de la station',
      stationNamePlaceholder: 'ex. MetroPulse FM', streamUrl: 'URL du stream',
      streamUrlPlaceholder: 'https://stream.example.com/live',
      nameRequired: 'Le nom est requis', urlRequired: 'L\'URL est requise',
      urlInvalid: 'L\'URL doit commencer par http:// ou https://',
      addStation: 'Ajouter la station', cancel: 'Annuler',
      deleteConfirm: 'Supprimer {name} ?',
      switchToLocal: 'Passer à la playlist locale',
      switchToRadio: 'Passer au lecteur radio',
      previousTrack: 'Piste précédente', nextTrack: 'Piste suivante',
      backToPlayer: 'Retour au lecteur', addTrack: 'Ajouter une piste',
      addFolder: 'Ajouter un dossier', addVideo: 'Ajouter une vidéo',
      remove: 'Supprimer', unmute: 'Réactiver le son', mute: 'Muet',
      pause: 'Pause', play: 'Lecture', hidePlaylist: 'Masquer la playlist',
      viewPlaylist: 'Voir la playlist',
      equalizerSettings: 'Égaliseur et paramètres',
      eqPresetFlat: 'Plat', eqPresetBassBoost: 'Boost des basses',
      eqPresetTrebleBoost: 'Boost des aigus', eqPresetVocal: 'Vocal',
      eqPresetRock: 'Rock', eqPresetPop: 'Pop', eqPresetJazz: 'Jazz',
      eqPresetClassical: 'Classique', eqPresetPhonograph: 'Phonographe',
      eqPresetBassReducesHighs: 'Basses réduisent aigus',
      eqDescFlat: 'Réponse plate', eqDescBassBoost: 'Basses renforcées',
      eqDescTrebleBoost: 'Aigus renforcés', eqDescVocal: 'Accent vocal',
      eqDescRock: 'Préréglage rock', eqDescPop: 'Préréglage pop',
      eqDescJazz: 'Préréglage jazz', eqDescClassical: 'Préréglage classique',
      eqDescPhonograph: 'Son phonographe vintage',
      eqDescBassReducesHighs: 'Basses avec aigus réduits',
      customPreset: 'Préréglage personnalisé',
      videoLoaded: 'Vidéo chargée', invalidFile: 'Fichier invalide',
      selectVideoFile: 'Veuillez sélectionner un fichier vidéo',
      appliedPreset: 'Appliqué : {name}',
      enterPresetName: 'Veuillez entrer un nom pour votre préréglage',
      presetSaved: 'Préréglage enregistré !',
      presetSaveFailed: 'Échec de l\'enregistrement du préréglage',
      presetDeleted: 'Préréglage supprimé',
      noMediaFound: 'Aucun fichier média trouvé dans le dossier'
    },
    settings: {
      defaultUserHandle: '@joker', defaultUsername: 'Joker',
      icqEmojiSkin: 'Skin d\'emoji ICQ', networkSubtitle: 'Sous-vue des paramètres réseau',
      privacySubView: 'Sous-vue des paramètres de confidentialité',
      forwardPrivacy: 'Confidentialité du transfert'
    },
    voiceRecorder: {
      discard: 'Jeter',
      micBlocked: 'L\'accès au microphone est bloqué. Autorise les permissions du microphone.',
      pause: 'Pause', play: 'Lecture', preview: 'Aperçu du message vocal',
      rerecord: 'Ré-enregistrer', resume: 'Reprendre',
      seek: 'Chercher dans le message vocal', send: 'Envoyer',
      stopAndSend: 'Arrêter et envoyer'
    }
  },
  ja: {
    chat: {
      all: 'すべて', clear: 'クリア', clearChatHistory: 'チャット履歴を消去',
      contact: '連絡先', e2eEncrypted: 'E2E暗号化', filters: 'フィルター',
      filtersOn: 'フィルターON', from: 'From:', items: '{{count}}件',
      linkPreview: 'リンクプレビュー', links: 'リンク', me: '自分',
      media: 'メディア', mediaAlt: 'メディア', message: 'メッセージ',
      moreEmoji: 'もっと絵文字', morePinned: '+{{n}}件のピン留め',
      nSaved: '{{n}}件保存', noOneYet: 'まだ誰もいません',
      noSavedMessages: '保存済みメッセージはまだありません',
      offline: 'オフライン', online: 'オンライン', others: 'その他',
      photo: '写真', photos: '写真', pin: 'ピン留め',
      pinned: 'ピン留め済み', pinnedVoice: '\uD83C\uDFB5 ボイス',
      reactedBy: 'リアクションしたユーザー', ready: '準備完了',
      repliesLabel: '返信', reply: '返信', replyLabel: '返信',
      save: '保存', saved: '保存済み',
      savedItems: '{{chatName}}に{{n}}件のアイテム',
      savedMessagesHint: 'メッセージを長押ししてブックマークをタップすると保存できます',
      searchInChat: 'チャット内を検索...',
      searchMessages: 'メッセージ、ユーザーを検索...',
      selfDestructActive: '自動消去有効（1時間）',
      sharedAlt: '共有', startAudioCall: '音声通話を開始',
      startVideoCall: 'ビデオ通話を開始', to: 'まで',
      unknownCall: '不明な通話', unpin: 'ピン留め解除',
      unsave: '保存解除', videoThumbnailAlt: 'ビデオサムネイル',
      voiceNoteLabel: 'ボイスメモ', voiceNotes: 'ボイスメモ',
      you: 'あなた'
    },
    comments: { leaveComment: 'コメントを残す' },
    common: {
      accounts: 'アカウント', ad: '広告', addAccount: 'アカウントを追加',
      newAccountName: '新しいアカウント名...', sponsored: 'スポンサー', you: 'あなた'
    },
    contacts: {
      addDetailsHint: '名前と一意のネットワークIDを入力して接続を確立します。',
      editDetailsHint: '以下の連絡先詳細を更新します。',
      fieldTypeCustom: 'カスタム', fieldTypeEmail: 'メール',
      fieldTypePhone: '電話', fieldTypeSignal: 'Signal',
      fieldTypeTelegram: 'Telegram', fieldTypeWhatsapp: 'WhatsApp',
      phoneSubtypeHome: '自宅', phoneSubtypeMain: 'メイン',
      phoneSubtypeMobile: '携帯', phoneSubtypeWork: '仕事',
      validationRequired: '両方のフィールドに入力してください'
    },
    emoji: { noIcqFound: 'ICQ絵文字が見つかりません', noRecent: '最近の絵文字はまだありません' },
    lock: { enterPin: 'PINを入力', invalidPin: '無効なPIN' },
    media: { fullView: '全体表示', p2pEncrypted: 'P2P暗号化メディア' },
    player: {
      systemPlayer: 'システムプレーヤー', audioSettings: 'オーディオ設定',
      masterVolume: 'マスターボリューム', equalizer: '5バンドイコライザー',
      resetEq: 'EQをリセット', noTracks: 'トラックがありません',
      radioLink: 'ラジオリンク', localTrack: 'ローカルトラック',
      radioStations: 'ラジオ局', systemPlaylist: 'システムプレイリスト',
      addRadioStation: 'ラジオ局を追加', stationName: '局名',
      stationNamePlaceholder: '例：MetroPulse FM', streamUrl: 'ストリームURL',
      streamUrlPlaceholder: 'https://stream.example.com/live',
      nameRequired: '名前が必要です', urlRequired: 'URLが必要です',
      urlInvalid: 'URLはhttp://またはhttps://で始まる必要があります',
      addStation: '局を追加', cancel: 'キャンセル',
      deleteConfirm: '{name}を削除しますか？',
      switchToLocal: 'ローカルプレイリストに切り替え',
      switchToRadio: 'ラジオプレーヤーに切り替え',
      previousTrack: '前のトラック', nextTrack: '次のトラック',
      backToPlayer: 'プレーヤーに戻る', addTrack: 'トラックを追加',
      addFolder: 'フォルダを追加', addVideo: 'ビデオを追加',
      remove: '削除', unmute: 'ミュート解除', mute: 'ミュート',
      pause: '一時停止', play: '再生', hidePlaylist: 'プレイリストを隠す',
      viewPlaylist: 'プレイリストを表示',
      equalizerSettings: 'イコライザーと設定',
      eqPresetFlat: 'フラット', eqPresetBassBoost: 'バスブースト',
      eqPresetTrebleBoost: 'トレブルブースト', eqPresetVocal: 'ボーカル',
      eqPresetRock: 'ロック', eqPresetPop: 'ポップ', eqPresetJazz: 'ジャズ',
      eqPresetClassical: 'クラシック', eqPresetPhonograph: 'フォノグラフ',
      eqPresetBassReducesHighs: '低音が高音を抑制',
      eqDescFlat: 'フラットな応答', eqDescBassBoost: '強化された低音',
      eqDescTrebleBoost: '強化された高音', eqDescVocal: 'ボーカル強調',
      eqDescRock: 'ロック用プリセット', eqDescPop: 'ポップ用プリセット',
      eqDescJazz: 'ジャズ用プリセット', eqDescClassical: 'クラシック用プリセット',
      eqDescPhonograph: 'ビンテージ蓄音機サウンド',
      eqDescBassReducesHighs: '低音強化、高音抑制',
      customPreset: 'カスタムプリセット',
      videoLoaded: 'ビデオ読み込み完了', invalidFile: '無効なファイル',
      selectVideoFile: 'ビデオファイルを選択してください',
      appliedPreset: '適用：{name}',
      enterPresetName: 'プリセットの名前を入力してください',
      presetSaved: 'プリセットを保存しました！',
      presetSaveFailed: 'プリセットの保存に失敗しました',
      presetDeleted: 'プリセットを削除しました',
      noMediaFound: 'フォルダにメディアファイルが見つかりません'
    },
    settings: {
      defaultUserHandle: '@joker', defaultUsername: 'Joker',
      icqEmojiSkin: 'ICQ絵文字スキン', networkSubtitle: 'ネットワーク設定サブビュー',
      privacySubView: 'プライバシー設定サブビュー',
      forwardPrivacy: '転送プライバシー'
    },
    voiceRecorder: {
      discard: '破棄',
      micBlocked: 'マイクアクセスがブロックされています。マイクの許可を有効にしてください。',
      pause: '一時停止', play: '再生', preview: 'ボイスメモプレビュー',
      rerecord: '録り直し', resume: '再開',
      seek: 'ボイスメモをシーク', send: '送信',
      stopAndSend: '停止して送信'
    }
  },
  ko: {
    chat: {
      all: '전체', clear: '지우기', clearChatHistory: '채팅 기록 지우기',
      contact: '연락처', e2eEncrypted: 'E2E 암호화', filters: '필터',
      filtersOn: '필터 켜짐', from: 'From:', items: '{{count}}개 항목',
      linkPreview: '링크 미리보기', links: '링크', me: '나',
      media: '미디어', mediaAlt: '미디어', message: '메시지',
      moreEmoji: '더 많은 이모지', morePinned: '+{{n}}개 더 고정됨',
      nSaved: '{{n}}개 저장됨', noOneYet: '아직 아무도 없음',
      noSavedMessages: '아직 저장된 메시지가 없습니다',
      offline: '오프라인', online: '온라인', others: '다른 사람',
      photo: '사진', photos: '사진', pin: '고정',
      pinned: '고정됨', pinnedVoice: '\uD83C\uDFB5 음성',
      reactedBy: '반응한 사람', ready: '준비',
      repliesLabel: '답글', reply: '답장', replyLabel: '답글',
      save: '저장', saved: '저장됨',
      savedItems: '{{chatName}}에 {{n}}개 항목',
      savedMessagesHint: '메시지를 길게 눌러 북마크를 탭하면 저장됩니다',
      searchInChat: '채팅에서 검색...',
      searchMessages: '메시지, 사람 검색...',
      selfDestructActive: '자동 삭제 활성화 (1시간)',
      sharedAlt: '공유됨', startAudioCall: '음성 통화 시작',
      startVideoCall: '영상 통화 시작', to: '까지',
      unknownCall: '알 수 없는 통화', unpin: '고정 해제',
      unsave: '저장 취소', videoThumbnailAlt: '비디오 썸네일',
      voiceNoteLabel: '음성 메모', voiceNotes: '음성 메모',
      you: '당신'
    },
    comments: { leaveComment: '댓글 남기기' },
    common: {
      accounts: '계정', ad: '광고', addAccount: '계정 추가',
      newAccountName: '새 계정 이름...', sponsored: '스폰서', you: '당신'
    },
    contacts: {
      addDetailsHint: '이름과 고유 네트워크 ID를 입력하여 연결을 설정하세요.',
      editDetailsHint: '아래에서 연락처 세부정보를 업데이트하세요.',
      fieldTypeCustom: '사용자 정의', fieldTypeEmail: '이메일',
      fieldTypePhone: '전화', fieldTypeSignal: 'Signal',
      fieldTypeTelegram: 'Telegram', fieldTypeWhatsapp: 'WhatsApp',
      phoneSubtypeHome: '집', phoneSubtypeMain: '기본',
      phoneSubtypeMobile: '휴대폰', phoneSubtypeWork: '직장',
      validationRequired: '두 필드를 모두 입력해주세요'
    },
    emoji: { noIcqFound: 'ICQ 이모지를 찾을 수 없음', noRecent: '최근 이모지가 아직 없습니다' },
    lock: { enterPin: 'PIN 입력', invalidPin: '유효하지 않은 PIN' },
    media: { fullView: '전체 보기', p2pEncrypted: 'P2P 암호화 미디어' },
    player: {
      systemPlayer: '시스템 플레이어', audioSettings: '오디오 설정',
      masterVolume: '마스터 볼륨', equalizer: '5밴드 이퀄라이저',
      resetEq: 'EQ 초기화', noTracks: '트랙 없음',
      radioLink: '라디오 링크', localTrack: '로컬 트랙',
      radioStations: '라디오 방송국', systemPlaylist: '시스템 플레이리스트',
      addRadioStation: '라디오 방송국 추가', stationName: '방송국 이름',
      stationNamePlaceholder: '예: MetroPulse FM', streamUrl: '스트림 URL',
      streamUrlPlaceholder: 'https://stream.example.com/live',
      nameRequired: '이름이 필요합니다', urlRequired: 'URL이 필요합니다',
      urlInvalid: 'URL은 http:// 또는 https://로 시작해야 합니다',
      addStation: '방송국 추가', cancel: '취소',
      deleteConfirm: '{name}을(를) 삭제할까요?',
      switchToLocal: '로컬 플레이리스트로 전환',
      switchToRadio: '라디오 플레이어로 전환',
      previousTrack: '이전 트랙', nextTrack: '다음 트랙',
      backToPlayer: '플레이어로 돌아가기', addTrack: '트랙 추가',
      addFolder: '폴더 추가', addVideo: '비디오 추가',
      remove: '제거', unmute: '음소거 해제', mute: '음소거',
      pause: '일시정지', play: '재생', hidePlaylist: '플레이리스트 숨기기',
      viewPlaylist: '플레이리스트 보기',
      equalizerSettings: '이퀄라이저 및 설정',
      eqPresetFlat: '플랫', eqPresetBassBoost: '베이스 부스트',
      eqPresetTrebleBoost: '트레블 부스트', eqPresetVocal: '보컬',
      eqPresetRock: '록', eqPresetPop: '팝', eqPresetJazz: '재즈',
      eqPresetClassical: '클래식', eqPresetPhonograph: '포노그래프',
      eqPresetBassReducesHighs: '베이스가 고음 감소',
      eqDescFlat: '플랫 응답', eqDescBassBoost: '강화된 베이스',
      eqDescTrebleBoost: '강화된 고음', eqDescVocal: '보컬 강조',
      eqDescRock: '록 음악 프리셋', eqDescPop: '팝 음악 프리셋',
      eqDescJazz: '재즈 음악 프리셋', eqDescClassical: '클래식 음악 프리셋',
      eqDescPhonograph: '빈티지 포노그래프 사운드',
      eqDescBassReducesHighs: '베이스 강화와 고음 감소',
      customPreset: '사용자 정의 프리셋',
      videoLoaded: '비디오 로드됨', invalidFile: '유효하지 않은 파일',
      selectVideoFile: '비디오 파일을 선택해주세요',
      appliedPreset: '적용됨: {name}',
      enterPresetName: '프리셋 이름을 입력해주세요',
      presetSaved: '프리셋이 저장되었습니다!',
      presetSaveFailed: '프리셋 저장에 실패했습니다',
      presetDeleted: '프리셋이 삭제되었습니다',
      noMediaFound: '폴더에서 미디어 파일을 찾을 수 없습니다'
    },
    settings: {
      defaultUserHandle: '@joker', defaultUsername: 'Joker',
      icqEmojiSkin: 'ICQ 이모지 스킨', networkSubtitle: '네트워크 설정 하위 보기',
      privacySubView: '개인정보 설정 하위 보기',
      forwardPrivacy: '전송 개인정보'
    },
    voiceRecorder: {
      discard: '버리기',
      micBlocked: '마이크 액세스가 차단되었습니다. 마이크 권한을 허용해주세요.',
      pause: '일시정지', play: '재생', preview: '음성 메모 미리보기',
      rerecord: '다시 녹음', resume: '재개',
      seek: '음성 메모 탐색', send: '보내기',
      stopAndSend: '중지하고 보내기'
    }
  },
  ru: {
    chat: {
      all: 'Все', clear: 'Очистить', clearChatHistory: 'Очистить историю чата',
      contact: 'Контакт', e2eEncrypted: 'E2E шифрование', filters: 'Фильтры',
      filtersOn: 'Фильтры ВКЛ', from: 'От:', items: '{{count}} элементов',
      linkPreview: 'Предпросмотр ссылки', links: 'Ссылки', me: 'Я',
      media: 'Медиа', mediaAlt: 'медиа', message: 'Сообщение',
      moreEmoji: 'Больше эмодзи', morePinned: '+{{n}} ещё закреплено',
      nSaved: 'Сохранено: {{n}}', noOneYet: 'Пока никого',
      noSavedMessages: 'Сохранённых сообщений пока нет',
      offline: 'Не в сети', online: 'В сети', others: 'Другие',
      photo: 'Фото', photos: 'Фото', pin: 'Закрепить',
      pinned: 'Закреплено', pinnedVoice: '\uD83C\uDFB5 Голосовое',
      reactedBy: 'Реакция от', ready: 'готово',
      repliesLabel: 'ответов', reply: 'Ответить', replyLabel: 'ответ',
      save: 'Сохранить', saved: 'Сохранено',
      savedItems: '{{n}} элементов в {{chatName}}',
      savedMessagesHint: 'Зажми сообщение и нажми Закладка, чтобы сохранить',
      searchInChat: 'Поиск в чате...',
      searchMessages: 'Поиск сообщений, людей...',
      selfDestructActive: 'Самоуничтожение активно (1ч)',
      sharedAlt: 'Поделились', startAudioCall: 'Аудиозвонок',
      startVideoCall: 'Видеозвонок', to: 'до',
      unknownCall: 'Неизвестный звонок', unpin: 'Открепить',
      unsave: 'Удалить', videoThumbnailAlt: 'Миниатюра видео',
      voiceNoteLabel: 'Голосовое сообщение', voiceNotes: 'Голосовые сообщения',
      you: 'Вы'
    },
    comments: { leaveComment: 'Оставить комментарий' },
    common: {
      accounts: 'Аккаунты', ad: 'РЕКЛАМА', addAccount: 'Добавить аккаунт',
      newAccountName: 'Новое имя аккаунта...', sponsored: 'спонсировано', you: 'Вы'
    },
    contacts: {
      addDetailsHint: 'Введите имя и уникальный сетевой ID для установления связи.',
      editDetailsHint: 'Обновите данные контакта ниже.',
      fieldTypeCustom: 'Другое', fieldTypeEmail: 'Email',
      fieldTypePhone: 'Телефон', fieldTypeSignal: 'Signal',
      fieldTypeTelegram: 'Telegram', fieldTypeWhatsapp: 'WhatsApp',
      phoneSubtypeHome: 'Домашний', phoneSubtypeMain: 'Основной',
      phoneSubtypeMobile: 'Мобильный', phoneSubtypeWork: 'Рабочий',
      validationRequired: 'Пожалуйста, заполните оба поля'
    },
    emoji: { noIcqFound: 'Эмодзи ICQ не найдены', noRecent: 'Нет недавних эмодзи' },
    lock: { enterPin: 'Введите PIN', invalidPin: 'Неверный PIN' },
    media: { fullView: 'Полный экран', p2pEncrypted: 'P2P зашифрованные медиа' },
    player: {
      systemPlayer: 'СИСТЕМНЫЙ ПЛЕЕР', audioSettings: 'Настройки звука',
      masterVolume: 'Общая громкость', equalizer: '5-полосный эквалайзер',
      resetEq: 'Сбросить эквалайзер', noTracks: 'Нет треков',
      radioLink: 'ССЫЛКА НА РАДИО', localTrack: 'ЛОКАЛЬНЫЙ ТРЕК',
      radioStations: 'Радиостанции', systemPlaylist: 'Системный плейлист',
      addRadioStation: 'Добавить радиостанцию', stationName: 'Название станции',
      stationNamePlaceholder: 'например, MetroPulse FM', streamUrl: 'URL трансляции',
      streamUrlPlaceholder: 'https://stream.example.com/live',
      nameRequired: 'Требуется название', urlRequired: 'Требуется URL',
      urlInvalid: 'URL должен начинаться с http:// или https://',
      addStation: 'Добавить станцию', cancel: 'Отмена',
      deleteConfirm: 'Удалить {name}?',
      switchToLocal: 'Переключиться на локальный плейлист',
      switchToRadio: 'Переключиться на радио',
      previousTrack: 'Предыдущий трек', nextTrack: 'Следующий трек',
      backToPlayer: 'Назад к плееру', addTrack: 'Добавить трек',
      addFolder: 'Добавить папку', addVideo: 'Добавить видео',
      remove: 'Удалить', unmute: 'Включить звук', mute: 'Выключить звук',
      pause: 'Пауза', play: 'Играть', hidePlaylist: 'Скрыть плейлист',
      viewPlaylist: 'Показать плейлист',
      equalizerSettings: 'Эквалайзер и настройки',
      eqPresetFlat: 'Плоский', eqPresetBassBoost: 'Усиление басов',
      eqPresetTrebleBoost: 'Усиление высоких', eqPresetVocal: 'Вокал',
      eqPresetRock: 'Рок', eqPresetPop: 'Поп', eqPresetJazz: 'Джаз',
      eqPresetClassical: 'Классика', eqPresetPhonograph: 'Патефон',
      eqPresetBassReducesHighs: 'Бас снижает высокие',
      eqDescFlat: 'Плоская АЧХ', eqDescBassBoost: 'Усиленные басы',
      eqDescTrebleBoost: 'Усиленные высокие', eqDescVocal: 'Акцент на вокале',
      eqDescRock: 'Пресет для рока', eqDescPop: 'Пресет для поп-музыки',
      eqDescJazz: 'Пресет для джаза', eqDescClassical: 'Пресет для классики',
      eqDescPhonograph: 'Звук винтажного патефона',
      eqDescBassReducesHighs: 'Бас с уменьшенными высокими',
      customPreset: 'Пользовательский пресет',
      videoLoaded: 'Видео загружено', invalidFile: 'Неверный файл',
      selectVideoFile: 'Пожалуйста, выберите видеофайл',
      appliedPreset: 'Применён: {name}',
      enterPresetName: 'Пожалуйста, введите имя для пресета',
      presetSaved: 'Пресет сохранён!',
      presetSaveFailed: 'Не удалось сохранить пресет',
      presetDeleted: 'Пресет удалён',
      noMediaFound: 'Медиафайлы в папке не найдены'
    },
    settings: {
      defaultUserHandle: '@joker', defaultUsername: 'Joker',
      icqEmojiSkin: 'Скин эмодзи ICQ', networkSubtitle: 'Подвид настроек сети',
      privacySubView: 'Подвид настроек приватности',
      forwardPrivacy: 'Приватность пересылки'
    },
    voiceRecorder: {
      discard: 'Отменить',
      micBlocked: 'Доступ к микрофону заблокирован. Пожалуйста, разрешите доступ к микрофону.',
      pause: 'Пауза', play: 'Воспроизвести', preview: 'Предпросмотр',
      rerecord: 'Перезаписать', resume: 'Продолжить',
      seek: 'Перемотка', send: 'Отправить',
      stopAndSend: 'Остановить и отправить'
    }
  },
  zh: {
    chat: {
      all: '全部', clear: '清除', clearChatHistory: '清除聊天记录',
      contact: '联系人', e2eEncrypted: 'E2E 加密', filters: '筛选',
      filtersOn: '筛选已开启', from: 'From:', items: '{{count}}项',
      linkPreview: '链接预览', links: '链接', me: '我',
      media: '媒体', mediaAlt: '媒体', message: '消息',
      moreEmoji: '更多表情', morePinned: '+{{n}}条更多置顶',
      nSaved: '{{n}}条已保存', noOneYet: '尚无任何人',
      noSavedMessages: '暂无已保存的消息',
      offline: '离线', online: '在线', others: '其他人',
      photo: '照片', photos: '照片', pin: '置顶',
      pinned: '已置顶', pinnedVoice: '\uD83C\uDFB5 语音',
      reactedBy: '反应来自', ready: '就绪',
      repliesLabel: '回复', reply: '回复', replyLabel: '回复',
      save: '保存', saved: '已保存',
      savedItems: '{{chatName}}中的{{n}}项',
      savedMessagesHint: '长按消息并点击书签即可保存',
      searchInChat: '在聊天中搜索...',
      searchMessages: '搜索消息、联系人...',
      selfDestructActive: '阅后即焚已开启（1小时）',
      sharedAlt: '已分享', startAudioCall: '开始语音通话',
      startVideoCall: '开始视频通话', to: '至',
      unknownCall: '未知通话', unpin: '取消置顶',
      unsave: '取消保存', videoThumbnailAlt: '视频缩略图',
      voiceNoteLabel: '语音消息', voiceNotes: '语音消息',
      you: '你'
    },
    comments: { leaveComment: '发表评论' },
    common: {
      accounts: '账户', ad: '广告', addAccount: '添加账户',
      newAccountName: '新账户名称...', sponsored: '赞助', you: '你'
    },
    contacts: {
      addDetailsHint: '输入对方的姓名和唯一网络 ID 以建立连接。',
      editDetailsHint: '请在下方更新联系人详情。',
      fieldTypeCustom: '自定义', fieldTypeEmail: '邮箱',
      fieldTypePhone: '电话', fieldTypeSignal: 'Signal',
      fieldTypeTelegram: 'Telegram', fieldTypeWhatsapp: 'WhatsApp',
      phoneSubtypeHome: '家庭', phoneSubtypeMain: '主要',
      phoneSubtypeMobile: '手机', phoneSubtypeWork: '工作',
      validationRequired: '请填写两个字段'
    },
    emoji: { noIcqFound: '未找到 ICQ 表情', noRecent: '暂无最近使用的表情' },
    lock: { enterPin: '输入 PIN', invalidPin: '无效 PIN' },
    media: { fullView: '完整视图', p2pEncrypted: 'P2P 加密媒体' },
    player: {
      systemPlayer: '系统播放器', audioSettings: '音频设置',
      masterVolume: '主音量', equalizer: '5 段均衡器',
      resetEq: '重置均衡器', noTracks: '暂无音轨',
      radioLink: '电台链接', localTrack: '本地音轨',
      radioStations: '电台列表', systemPlaylist: '系统播放列表',
      addRadioStation: '添加电台', stationName: '电台名称',
      stationNamePlaceholder: '例如：MetroPulse FM', streamUrl: '流媒体 URL',
      streamUrlPlaceholder: 'https://stream.example.com/live',
      nameRequired: '名称不能为空', urlRequired: 'URL 不能为空',
      urlInvalid: 'URL 必须以 http:// 或 https:// 开头',
      addStation: '添加电台', cancel: '取消',
      deleteConfirm: '删除 {name}？',
      switchToLocal: '切换到本地播放列表',
      switchToRadio: '切换到电台播放器',
      previousTrack: '上一曲', nextTrack: '下一曲',
      backToPlayer: '返回播放器', addTrack: '添加音轨',
      addFolder: '添加文件夹', addVideo: '添加视频',
      remove: '移除', unmute: '取消静音', mute: '静音',
      pause: '暂停', play: '播放', hidePlaylist: '隐藏播放列表',
      viewPlaylist: '查看播放列表',
      equalizerSettings: '均衡器与设置',
      eqPresetFlat: '平坦', eqPresetBassBoost: '低音增强',
      eqPresetTrebleBoost: '高音增强', eqPresetVocal: '人声',
      eqPresetRock: '摇滚', eqPresetPop: '流行', eqPresetJazz: '爵士',
      eqPresetClassical: '古典', eqPresetPhonograph: '留声机',
      eqPresetBassReducesHighs: '低音减弱高音',
      eqDescFlat: '平坦响应', eqDescBassBoost: '增强低音',
      eqDescTrebleBoost: '增强高音', eqDescVocal: '人声突出',
      eqDescRock: '摇滚音乐预设', eqDescPop: '流行音乐预设',
      eqDescJazz: '爵士音乐预设', eqDescClassical: '古典音乐预设',
      eqDescPhonograph: '复古留声机音效',
      eqDescBassReducesHighs: '低音增强同时减弱高音',
      customPreset: '自定义预设',
      videoLoaded: '视频已加载', invalidFile: '无效文件',
      selectVideoFile: '请选择一个视频文件',
      appliedPreset: '已应用：{name}',
      enterPresetName: '请为你的预设输入名称',
      presetSaved: '预设已保存！',
      presetSaveFailed: '预设保存失败',
      presetDeleted: '预设已删除',
      noMediaFound: '文件夹中未找到媒体文件'
    },
    settings: {
      defaultUserHandle: '@joker', defaultUsername: 'Joker',
      icqEmojiSkin: 'ICQ 表情皮肤', networkSubtitle: '网络设置子视图',
      privacySubView: '隐私设置子视图',
      forwardPrivacy: '转发隐私'
    },
    voiceRecorder: {
      discard: '丢弃',
      micBlocked: '麦克风访问被阻止。请允许麦克风权限。',
      pause: '暂停', play: '播放', preview: '语音消息预览',
      rerecord: '重新录制', resume: '继续',
      seek: '搜索语音消息', send: '发送',
      stopAndSend: '停止并发送'
    }
  }
};

const additionalTranslations = {
  de: {
    chat: {
      filters: {
        searchMessages: 'Nachrichten suchen'
      },
      archived: 'Archiviert',
      createBot: 'Bot erstellen',
      createChannel: 'Kanal erstellen',
      endCall: 'Anruf beenden',
      folders: {
        all: 'Alle',
        archived: 'Archiv',
        personal: 'Persönlich',
        unread: 'Ungelesen',
        work: 'Arbeit'
      },
      goBack: 'Zurück',
      mute: 'Stummschalten',
      searchBotsPlaceholder: 'Bots oder Dienste durchsuchen...',
      searchChannelsPlaceholder: 'Kanäle durchsuchen...',
      searchPlaceholder: 'Chats oder Nachrichten durchsuchen...',
      sectionBots: 'Meine Bots',
      sectionChannels: 'Kanäle',
      sectionConversations: 'Unterhaltungen',
      tabs: {
        bots: 'Bots',
        channels: 'Kanäle',
        chats: 'Chats',
        stories: 'Storys'
      },
      unmute: 'Stummschaltung aufheben'
    },
    settings: {
      proxyUrl: 'Proxy-URL',
      proxyUrlSubtitle: 'SOCKS5-Proxy-Adresse',
      recoveryPhrase: 'Wiederherstellungsphrase',
      recoveryPhraseGenerated: 'Wiederherstellungsphrase generiert ✓',
      recoveryPhraseInvalid: 'Ungültige oder falsche Phrase',
      recoveryPhraseIveSavedIt: 'Ich habe sie gespeichert',
      recoveryPhraseRestoreSubtitle: 'Gib deine 10-Wörter-Wiederherstellungsphrase ein, um deine Daten wiederherzustellen.',
      recoveryPhraseRestoreTitle: 'Aus Wiederherstellungsphrase wiederherstellen',
      recoveryPhraseRestoring: 'Wiederherstellung läuft...',
      recoveryPhraseSubtitle: 'Backup-Wiederherstellungsphrase generieren',
      recoveryPhraseSuccess: 'Wiederherstellung erfolgreich!',
      recoveryPhraseWriteDown: 'Schreibe sie auf und bewahre sie sicher auf. Nur so kannst du deine Daten wiederherstellen.',
      torBridge: 'Tor-Brücke',
      torBridgeSubtitle: 'Brücken helfen, Zensur zu umgehen'
    },
    stickers: {
      all: 'Alle',
      animals: 'Tiere',
      default: 'Standard',
      emoji: 'Emoji',
      food: 'Essen',
      icq: 'ICQ',
      nature: 'Natur',
      searchPlaceholder: 'Sticker suchen...'
    }
  },
  es: {
    chat: {
      filters: {
        searchMessages: 'Buscar mensajes'
      },
      archived: 'Archivado',
      createBot: 'Crear bot',
      createChannel: 'Crear canal',
      endCall: 'Finalizar llamada',
      folders: {
        all: 'Todos',
        archived: 'Archivados',
        personal: 'Personal',
        unread: 'No leídos',
        work: 'Trabajo'
      },
      goBack: 'Volver',
      mute: 'Silenciar',
      searchBotsPlaceholder: 'Buscar bots o servicios...',
      searchChannelsPlaceholder: 'Buscar canales...',
      searchPlaceholder: 'Buscar chats o mensajes...',
      sectionBots: 'Mis bots',
      sectionChannels: 'Canales',
      sectionConversations: 'Conversaciones',
      tabs: {
        bots: 'Bots',
        channels: 'Canales',
        chats: 'Chats',
        stories: 'Historias'
      },
      unmute: 'Reactivar sonido'
    },
    settings: {
      proxyUrl: 'URL del proxy',
      proxyUrlSubtitle: 'Dirección del proxy SOCKS5',
      recoveryPhrase: 'Frase de recuperación',
      recoveryPhraseGenerated: 'Frase de recuperación generada ✓',
      recoveryPhraseInvalid: 'Frase inválida o incorrecta',
      recoveryPhraseIveSavedIt: 'Ya la guardé',
      recoveryPhraseRestoreSubtitle: 'Introduce tu frase de recuperación de 10 palabras para restaurar tus datos.',
      recoveryPhraseRestoreTitle: 'Restaurar desde la frase de recuperación',
      recoveryPhraseRestoring: 'Restaurando...',
      recoveryPhraseSubtitle: 'Generar frase de recuperación de la copia de seguridad',
      recoveryPhraseSuccess: '¡Restauración correcta!',
      recoveryPhraseWriteDown: 'Escríbela y guárdala en un lugar seguro. Es la única forma de recuperar tus datos.',
      torBridge: 'Puente Tor',
      torBridgeSubtitle: 'Los puentes ayudan a evitar la censura'
    },
    stickers: {
      all: 'Todos',
      animals: 'Animales',
      default: 'Predeterminado',
      emoji: 'Emoji',
      food: 'Comida',
      icq: 'ICQ',
      nature: 'Naturaleza',
      searchPlaceholder: 'Buscar stickers...'
    }
  },
  fr: {
    chat: {
      filters: {
        searchMessages: 'Rechercher des messages'
      },
      archived: 'Archivé',
      createBot: 'Créer un bot',
      createChannel: 'Créer un canal',
      endCall: 'Terminer l’appel',
      folders: {
        all: 'Tous',
        archived: 'Archivés',
        personal: 'Personnel',
        unread: 'Non lus',
        work: 'Travail'
      },
      goBack: 'Revenir',
      mute: 'Muet',
      searchBotsPlaceholder: 'Rechercher des bots ou services...',
      searchChannelsPlaceholder: 'Rechercher des chaînes...',
      searchPlaceholder: 'Rechercher des chats ou messages...',
      sectionBots: 'Mes bots',
      sectionChannels: 'Canaux',
      sectionConversations: 'Conversations',
      tabs: {
        bots: 'Bots',
        channels: 'Canaux',
        chats: 'Chats',
        stories: 'Histoires'
      },
      unmute: 'Réactiver le son'
    },
    settings: {
      proxyUrl: 'URL du proxy',
      proxyUrlSubtitle: 'Adresse du proxy SOCKS5',
      recoveryPhrase: 'Phrase de récupération',
      recoveryPhraseGenerated: 'Phrase de récupération générée ✓',
      recoveryPhraseInvalid: 'Phrase invalide ou incorrecte',
      recoveryPhraseIveSavedIt: 'Je l’ai enregistrée',
      recoveryPhraseRestoreSubtitle: 'Saisis ta phrase de récupération de 10 mots pour restaurer tes données.',
      recoveryPhraseRestoreTitle: 'Restaurer depuis la phrase de récupération',
      recoveryPhraseRestoring: 'Restoration...',
      recoveryPhraseSubtitle: 'Générer une phrase de récupération de sauvegarde',
      recoveryPhraseSuccess: 'Restauration réussie !',
      recoveryPhraseWriteDown: 'Note-la et conserve-la en lieu sûr. C’est le seul moyen de récupérer tes données.',
      torBridge: 'Pont Tor',
      torBridgeSubtitle: 'Les ponts aident à contourner la censure'
    },
    stickers: {
      all: 'Tous',
      animals: 'Animaux',
      default: 'Par défaut',
      emoji: 'Emoji',
      food: 'Nourriture',
      icq: 'ICQ',
      nature: 'Nature',
      searchPlaceholder: 'Rechercher des stickers...'
    }
  },
  ja: {
    chat: {
      filters: {
        searchMessages: 'メッセージを検索'
      },
      archived: 'アーカイブ済み',
      createBot: 'ボットを作成',
      createChannel: 'チャンネルを作成',
      endCall: '通話を終了',
      folders: {
        all: 'すべて',
        archived: 'アーカイブ済み',
        personal: '個人',
        unread: '未読',
        work: '仕事'
      },
      goBack: '戻る',
      mute: 'ミュート',
      searchBotsPlaceholder: 'ボットまたはサービスを検索...',
      searchChannelsPlaceholder: 'チャンネルを検索...',
      searchPlaceholder: 'チャットまたはメッセージを検索...',
      sectionBots: 'マイボット',
      sectionChannels: 'チャンネル',
      sectionConversations: '会話',
      tabs: {
        bots: 'ボット',
        channels: 'チャンネル',
        chats: 'チャット',
        stories: 'ストーリー'
      },
      unmute: 'ミュート解除'
    },
    settings: {
      proxyUrl: 'プロキシURL',
      proxyUrlSubtitle: 'SOCKS5プロキシアドレス',
      recoveryPhrase: '復元フレーズ',
      recoveryPhraseGenerated: '復元フレーズを生成しました ✓',
      recoveryPhraseInvalid: '無効または誤ったフレーズ',
      recoveryPhraseIveSavedIt: '保存しました',
      recoveryPhraseRestoreSubtitle: '10語の復元フレーズを入力してデータを復元します。',
      recoveryPhraseRestoreTitle: '復元フレーズから復元',
      recoveryPhraseRestoring: '復元中...',
      recoveryPhraseSubtitle: 'バックアップ復元フレーズを生成',
      recoveryPhraseSuccess: '復元に成功しました！',
      recoveryPhraseWriteDown: 'このフレーズを書き留めて安全に保管してください。データを復元できる唯一の方法です。',
      torBridge: 'Torブリッジ',
      torBridgeSubtitle: 'ブリッジは検閲回避に役立ちます'
    },
    stickers: {
      all: 'すべて',
      animals: '動物',
      default: 'デフォルト',
      emoji: '絵文字',
      food: '食べ物',
      icq: 'ICQ',
      nature: '自然',
      searchPlaceholder: 'ステッカーを検索...'
    }
  },
  ko: {
    chat: {
      filters: {
        searchMessages: '메시지 검색'
      },
      archived: '보관됨',
      createBot: '봇 만들기',
      createChannel: '채널 만들기',
      endCall: '통화 종료',
      folders: {
        all: '전체',
        archived: '보관됨',
        personal: '개인',
        unread: '읽지 않음',
        work: '직장'
      },
      goBack: '뒤로',
      mute: '음소거',
      searchBotsPlaceholder: '봇 또는 서비스 검색...',
      searchChannelsPlaceholder: '채널 검색...',
      searchPlaceholder: '채팅 또는 메시지 검색...',
      sectionBots: '내 봇',
      sectionChannels: '채널',
      sectionConversations: '대화',
      tabs: {
        bots: '봇',
        channels: '채널',
        chats: '채팅',
        stories: '스토리'
      },
      unmute: '음소거 해제'
    },
    settings: {
      proxyUrl: '프록시 URL',
      proxyUrlSubtitle: 'SOCKS5 프록시 주소',
      recoveryPhrase: '복구 문구',
      recoveryPhraseGenerated: '복구 문구 생성됨 ✓',
      recoveryPhraseInvalid: '잘못되거나 올바르지 않은 문구',
      recoveryPhraseIveSavedIt: '저장 완료',
      recoveryPhraseRestoreSubtitle: '10단어 복구 문구를 입력하여 데이터를 복원하세요.',
      recoveryPhraseRestoreTitle: '복구 문구로 복원',
      recoveryPhraseRestoring: '복원 중...',
      recoveryPhraseSubtitle: '백업 복구 문구 생성',
      recoveryPhraseSuccess: '복원 성공!',
      recoveryPhraseWriteDown: '이 문구를 적어 안전하게 보관하세요. 데이터를 복원할 수 있는 유일한 방법입니다.',
      torBridge: 'Tor 브리지',
      torBridgeSubtitle: '브리지는 검열 우회에 도움이 됩니다'
    },
    stickers: {
      all: '전체',
      animals: '동물',
      default: '기본',
      emoji: '이모지',
      food: '음식',
      icq: 'ICQ',
      nature: '자연',
      searchPlaceholder: '스티커 검색...'
    }
  },
  ru: {
    chat: {
      filters: {
        searchMessages: 'Поиск сообщений'
      }
    },
    settings: {
      recoveryPhrase: 'Фраза восстановления',
      recoveryPhraseGenerated: 'Фраза восстановления создана ✓',
      recoveryPhraseInvalid: 'Неверная или неправильная фраза',
      recoveryPhraseIveSavedIt: 'Я сохранил(а)',
      recoveryPhraseRestoreSubtitle: 'Введите фразу восстановления из 10 слов, чтобы восстановить данные.',
      recoveryPhraseRestoreTitle: 'Восстановить по фразе восстановления',
      recoveryPhraseRestoring: 'Восстановление...',
      recoveryPhraseSubtitle: 'Создать резервную фразу восстановления',
      recoveryPhraseSuccess: 'Восстановление успешно!',
      recoveryPhraseWriteDown: 'Запишите её и храните в надёжном месте. Это единственный способ восстановить данные.',
      torBridge: 'Мост Tor',
      torBridgeSubtitle: 'Мосты помогают обходить цензуру'
    },
    stickers: {
      all: 'Все',
      animals: 'Животные',
      default: 'Стандартные',
      emoji: 'Эмодзи',
      food: 'Еда',
      icq: 'ICQ',
      nature: 'Природа',
      searchPlaceholder: 'Поиск стикеров...'
    }
  },
  zh: {
    chat: {
      filters: {
        searchMessages: '消息检索'
      },
      archived: '已归档',
      createBot: '创建机器人',
      createChannel: '创建频道',
      endCall: '结束通话',
      folders: {
        all: '全部',
        archived: '已归档',
        personal: '个人',
        unread: '未读',
        work: '工作'
      },
      goBack: '返回',
      mute: '静音',
      searchBotsPlaceholder: '搜索机器人或服务...',
      searchChannelsPlaceholder: '搜索频道...',
      searchPlaceholder: '搜索聊天或消息...',
      sectionBots: '我的机器人',
      sectionChannels: '频道',
      sectionConversations: '会话',
      tabs: {
        bots: '机器人',
        channels: '频道',
        chats: '聊天',
        stories: '故事'
      },
      unmute: '取消静音'
    },
    settings: {
      proxyUrl: '代理 URL',
      proxyUrlSubtitle: 'SOCKS5 代理地址',
      recoveryPhrase: '恢复短语',
      recoveryPhraseGenerated: '已生成恢复短语 ✓',
      recoveryPhraseInvalid: '短语无效或不正确',
      recoveryPhraseIveSavedIt: '我已保存',
      recoveryPhraseRestoreSubtitle: '输入 10 个词的恢复短语以恢复你的数据。',
      recoveryPhraseRestoreTitle: '从恢复短语恢复',
      recoveryPhraseRestoring: '正在恢复...',
      recoveryPhraseSubtitle: '生成备份恢复短语',
      recoveryPhraseSuccess: '恢复成功！',
      recoveryPhraseWriteDown: '请写下并安全保存。这是恢复数据的唯一方式。',
      torBridge: 'Tor 网桥',
      torBridgeSubtitle: '网桥有助于绕过审查'
    },
    stickers: {
      all: '全部',
      animals: '动物',
      default: '默认',
      emoji: '表情',
      food: '食物',
      icq: 'ICQ',
      nature: '自然',
      searchPlaceholder: '搜索贴纸...'
    }
  }
};

function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

const localeFiles = readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en.json').sort();

function mergeMissingSections(locale, sections, translationsForLang = {}) {
  for (const [key, enValue] of Object.entries(sections)) {
    if (!(key in locale)) {
      locale[key] = translationsForLang[key] !== undefined ? translationsForLang[key] : enValue;
      continue;
    }

    if (
      typeof enValue === 'object'
      && !Array.isArray(enValue)
      && typeof locale[key] === 'object'
      && locale[key] !== null
    ) {
      mergeMissingSections(
        locale[key],
        enValue,
        translationsForLang[key] && typeof translationsForLang[key] === 'object'
          ? translationsForLang[key]
          : {}
      );
    }
  }
}

function pruneExtraKeys(locale, reference) {
  for (const key of Object.keys(locale)) {
    if (!(key in reference)) {
      delete locale[key];
      continue;
    }

    if (
      typeof locale[key] === 'object'
      && locale[key] !== null
      && !Array.isArray(locale[key])
      && typeof reference[key] === 'object'
      && reference[key] !== null
      && !Array.isArray(reference[key])
    ) {
      pruneExtraKeys(locale[key], reference[key]);
    }
  }
}

for (const file of localeFiles) {
  const lang = file.replace('.json', '');
  const localePath = join(localesDir, file);
  const locale = JSON.parse(readFileSync(localePath, 'utf-8'));
  const localeTranslations = {
    ...(translations[lang] || {}),
    ...(additionalTranslations[lang] || {})
  };

  mergeMissingSections(locale, missingSections, localeTranslations);
  pruneExtraKeys(locale, enJson);

  for (const section of Object.keys(locale)) {
    if (typeof locale[section] === 'object' && !Array.isArray(locale[section])) {
      locale[section] = sortObjectKeys(locale[section]);
    }
  }

  const sortedLocale = sortObjectKeys(locale);

  writeFileSync(localePath, JSON.stringify(sortedLocale, null, 2) + '\n', 'utf-8');
  console.log(`Updated ${file}`);
}

console.log('\nAll locale files synced. Running verification...');
