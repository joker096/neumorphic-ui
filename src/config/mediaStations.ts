/**
 * Default radio stations for the SystemPulsePlayer
 */

export type RadioStation = {
  id: string;
  name: string;
  url: string;
  time: string;
  file: null;
};

export const DEFAULT_RADIO_STATIONS: RadioStation[] = [
  { id: "R1", name: "MetroPulse FM 104.5", url: "https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one", time: "LIVE", file: null },
  { id: "R2", name: "Lofi Beats", url: "https://streams.ilovemusic.de/iloveradio17.mp3", time: "LIVE", file: null },
];
