import { useEffect, useRef } from 'react';
import { useI18n } from '../lib/i18n';
import { SubView } from './ui/SubView';
import { Radar as RadarIcon } from 'lucide-react';

export const MeshRadar = ({ isDark = false, onBack }: { isDark?: boolean; onBack?: () => void }) => {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.width * dpr;
    ctx.scale(dpr, dpr);

    const size = rect.width;
    const center = size / 2;
    const radius = size * 0.4;
    let angle = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center, center, radius * 0.66, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(center, center, radius * 0.33, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + radius * Math.cos(angle), center + radius * Math.sin(angle));
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle - 0.5, angle, false);
      ctx.closePath();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
      ctx.fill();

      angle += 0.02;
      if (angle > Math.PI * 2) angle = 0;

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isDark]);

  return (
    <SubView title={t('nav.radar', 'Mesh Radar')} isDark={isDark} onBack={onBack || (() => {})}>
      <div className="flex flex-col gap-4">
        <div className={`flex flex-col items-center justify-center rounded-xl overflow-hidden ${isDark ? 'bg-[var(--bg-secondary)]' : 'bg-gray-50'}`}>
          <canvas
            ref={canvasRef}
            className="w-full aspect-square max-w-[320px]"
          />
          <div className="flex flex-col items-center gap-2 pb-6">
            <div className={`w-3 h-3 rounded-full ${isDark ? 'bg-orange-500/80' : 'bg-orange-400'}`} />
            <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {t('hub.radarSubtitle', 'Scanning for mesh nodes...')}
            </p>
          </div>
        </div>

        <div className={`rounded-xl p-4 ${isDark ? 'bg-[var(--bg-secondary)]' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-orange-500/10' : 'bg-orange-100'}`}>
              <RadarIcon size={20} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-800'}`}>
                {t('settings.meshNodesNearby', 'Mesh Nodes Nearby')}
              </p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {t('common.loading', 'Loading...')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SubView>
  );
};
