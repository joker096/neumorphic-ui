import { useI18n } from '../../../lib/i18n';

interface StoryProgressBarProps {
  /** Fill fraction 0..1 for each segment. */
  values: number[];
}

/** Thin segmented progress bar at the top of the story card (3px). */
export function StoryProgressBar({ values }: StoryProgressBarProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-1 w-full" role="progressbar" aria-label={t('story.progress')}>
      {values.map((v, i) => (
        <div key={i} className="h-[3px] flex-1 rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
