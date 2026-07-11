import React, { useEffect, useRef } from "react";
import { useI18n } from '../lib/i18n';
import { useMeshPeers } from '../hooks/useMeshPeers';

export const MeshRadar = ({ theme = 'dark' }: { theme?: "dark" | "light" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDark = theme === "dark";
  const { t } = useI18n();
  const label = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const { peers } = useMeshPeers();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const CX = W / 2;
    const CY = H / 2;
    const R = 160;
    const GREEN = isDark ? "#2bca74" : "#10b981";

    const renderPeers = peers.map(p => ({
      a: p.angle,
      d: p.distance,
      c: p.color,
      pulse: p.type === 'direct' && p.connected,
      label: p.label,
    }));

    let sweep = 0;
    let frame = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      frame += 0.016;
      sweep += 0.02;
      if (sweep > Math.PI * 2) sweep -= Math.PI * 2;

      ctx.fillStyle = isDark ? "#090b0a" : "#f8fafc";
      ctx.beginPath();
      ctx.arc(CX, CY, R + 4, 0, Math.PI * 2);
      ctx.fill();

      [0.25, 0.5, 0.75, 1].forEach((f) => {
        ctx.beginPath();
        ctx.arc(CX, CY, R * f, 0, Math.PI * 2);
        ctx.strokeStyle = isDark
          ? `rgba(43,202,116,${f === 1 ? 0.25 : 0.1})`
          : `rgba(16,185,129,${f === 1 ? 0.4 : 0.2})`;
        ctx.lineWidth = f === 1 ? 1.5 : 0.7;
        ctx.stroke();
      });

      ctx.strokeStyle = isDark ? "rgba(43,202,116,0.12)" : "rgba(16,185,129,0.2)";
      ctx.lineWidth = 0.7;
      [-Math.PI / 2, 0, Math.PI / 2, Math.PI].forEach((a) => {
        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(CX + Math.cos(a) * R, CY + Math.sin(a) * R);
        ctx.stroke();
      });

      ctx.save();
      ctx.translate(CX, CY);
      for (let i = 0; i < 30; i++) {
        const angle = sweep - i * 0.05;
        const alpha = (1 - i / 30) * 0.25;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, angle, angle + 0.05);
        ctx.lineTo(0, 0);
        ctx.fillStyle = isDark
          ? `rgba(43,202,116,${alpha})`
          : `rgba(16,185,129,${alpha})`;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(sweep) * R, Math.sin(sweep) * R);
      ctx.strokeStyle = isDark ? "rgba(43,202,116,0.8)" : "rgba(16,185,129,0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(CX, CY, 4, 0, Math.PI * 2);
      ctx.fillStyle = GREEN;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(CX, CY, 8 + Math.sin(frame * 2) * 2, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? "rgba(43,202,116,0.3)" : "rgba(16,185,129,0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      if (peers.length === 0) {
        ctx.fillStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("No peers connected", CX, CY + R * 0.7);
      }

      renderPeers.forEach((node) => {
        const x = CX + Math.cos(node.a) * node.d * R;
        const y = CY + Math.sin(node.a) * node.d * R;

        ctx.beginPath();
        ctx.moveTo(CX, CY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
        ctx.lineWidth = 0.5;
        ctx.stroke();

        if (node.pulse) {
          const pr = 10 + Math.abs(Math.sin(frame * 2)) * 6;
          ctx.beginPath();
          ctx.arc(x, y, pr, 0, Math.PI * 2);
          ctx.strokeStyle = `${node.c}${Math.floor(0.4 * (1 - pr / 16) * 255).toString(16)}`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = node.c;
        ctx.fill();

        ctx.fillStyle = isDark ? "rgba(43,202,116,0.8)" : "rgba(16,185,129,0.9)";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(node.label, x, y - 11);
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animId);
  }, [isDark, peers]);

  return (
    <div
      className={`p-6 flex flex-col items-center relative overflow-hidden w-full ${
        isDark
          ? "bg-[#101216] shadow-[inset_0_12px_24px_rgba(0,0,0,0.9),_inset_0_3px_6px_rgba(0,0,0,0.9)] border border-green-500/20"
          : "bg-[#e2e8f0] shadow-[inset_4px_4px_10px_rgba(165,175,190,0.4),_inset_-2px_-2px_6px_rgba(255,255,255,1)] border-black/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-4 w-full">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span
          className={`text-[10px] font-mono tracking-widest uppercase ${
            isDark ? "text-emerald-400" : "text-emerald-600"
          }`}
        >
          LIVE · {label('meshRadar.title', 'Mesh Radar')}
        </span>
      </div>

      <canvas
        ref={canvasRef}
        width={380}
        height={380}
        className={`rounded-full max-w-[90vw] ${
          isDark
            ? "shadow-[0_0_40px_rgba(43,202,116,0.1),_0_10px_20px_rgba(0,0,0,0.5)] border border-emerald-500/20"
            : "shadow-[0_0_30px_rgba(16,185,129,0.15),_4px_4px_10px_rgba(165,175,190,0.3),_inset_2px_2px_4px_rgba(255,255,255,1)] border border-emerald-500/30"
        }`}
      />

      <div
        className={`mt-6 w-full flex flex-col rounded-xl overflow-hidden ${
          isDark
            ? "bg-[#13151b] border border-white/5"
            : "bg-[#eaeff4] border border-white/80 shadow-[inset_2px_2px_4px_rgba(255,255,255,1),_4px_4px_8px_rgba(165,175,190,0.3)]"
        }`}
      >
        {peers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-[11px] font-mono">
            <span className={isDark ? "text-gray-500" : "text-slate-500"}>
              No peers connected
            </span>
            <span className={`mt-1.5 text-[10px] opacity-60 text-center max-w-[280px] leading-relaxed ${
              isDark ? "text-gray-600" : "text-slate-400"
            }`}>
              {label('meshRadar.emptyHint', 'Connect with contacts via QR or share your ID to appear on the radar')}
              <br className="my-1" />
              <span className="opacity-50">
                {label('meshRadar.emptyDesc', 'The radar shows your P2P mesh network nodes in real-time. Direct connections (WebRTC) appear with pulse, relayed connections show hop count.')}
              </span>
            </span>
          </div>
        ) : (
          peers.map((p, i) => (
            <div
              key={p.peerId}
              className={`flex items-center gap-3 p-3 text-[11px] font-mono ${
                i < peers.length - 1 ? "border-b" : ""
              } ${
                isDark ? "border-white/5 text-gray-300" : "border-black/5 text-slate-700"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span>{p.label}</span>
              <span className="ml-auto opacity-50">
                {p.type === 'direct' ? (p.connected ? 'Connected' : 'Connecting') : `${p.hops} hops`}
              </span>
            </div>
          ))
        )}
      </div>
      {peers.length > 0 && (
        <div className={`mt-3 text-[10px] font-mono text-center ${
          isDark ? "text-gray-600" : "text-slate-500"
        }`}>
          {label('meshRadar.hint', 'Drag contacts from list to connect directly')}
        </div>
      )}
    </div>
  );
};
