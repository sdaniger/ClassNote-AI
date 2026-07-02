export function WaveformPreview() {
  return (
    <div className="flex h-20 items-center justify-between rounded-[26px] border border-white/55 bg-white/48 px-4 shadow-inner backdrop-blur-xl">
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className="w-1.5 origin-center rounded-full bg-gradient-to-t from-rose-300 to-sky-400"
          style={{ height: `${40 + Math.sin(i * 1.2) * 30}%`, animation: `waveFloat ${1.4 + (i % 5) * 0.18}s ease-in-out infinite`, animationDelay: `${i * 0.04}s` }}
        />
      ))}
    </div>
  );
}
