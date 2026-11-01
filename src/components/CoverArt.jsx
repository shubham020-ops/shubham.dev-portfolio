import { useId, useState } from 'react';

/**
 * CoverArt component:
 * Displays a high-quality project screenshot / preview image when provided.
 * Gracefully falls back to dynamic geometric SVG artwork if no image is passed or if loading fails.
 */
const variants = {
  orbit: ({ uid, a, b, c }) => (
    <g>
      <circle cx="520" cy="260" r="300" fill={`url(#glow-${uid})`} opacity="0.55" />
      {[170, 235, 305].map((r, i) => (
        <circle key={r} cx="520" cy="260" r={r} fill="none" stroke="#fff" strokeOpacity={0.13 - i * 0.03} />
      ))}
      <circle cx="520" cy="260" r="118" fill={`url(#acc-${uid})`} />
      <circle cx="486" cy="226" r="40" fill="#fff" opacity="0.22" />
      <circle cx="250" cy="430" r="46" fill="none" stroke={b} strokeWidth="2" />
      <circle cx="250" cy="430" r="8" fill={c} />
      <circle cx="690" cy="470" r="5" fill={a} />
      <circle cx="140" cy="140" r="4" fill={b} />
    </g>
  ),
  grid: ({ uid, a, b, c }) => (
    <g>
      <circle cx="400" cy="120" r="260" fill={`url(#glow-${uid})`} opacity="0.35" />
      {Array.from({ length: 13 }, (_, i) => (
        <line key={`v${i}`} x1={400 + (i - 6) * 20} y1="260" x2={400 + (i - 6) * 140} y2="600" stroke="#fff" strokeOpacity="0.14" />
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const y = 260 + Math.pow(i, 1.7) * 18;
        return <line key={`h${i}`} x1="0" y1={y} x2="800" y2={y} stroke="#fff" strokeOpacity="0.12" />;
      })}
      {[90, 150, 120, 200, 170, 250].map((h, i) => (
        <rect key={i} x={120 + i * 100} y={250 - h} width="52" height={h} fill={i % 2 ? b : a} opacity="0.88" />
      ))}
      <rect x="120" y="250" width="552" height="2" fill={c} />
    </g>
  ),
  waves: ({ uid, a, b, c }) => (
    <g>
      <circle cx="200" cy="140" r="240" fill={`url(#glow-${uid})`} opacity="0.35" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M0 ${250 + i * 48} C 160 ${170 + i * 48}, 280 ${340 + i * 48}, 420 ${250 + i * 48} S 680 ${170 + i * 48}, 800 ${260 + i * 48}`}
          fill="none"
          stroke={[a, b, c][i % 3]}
          strokeWidth={i === 2 ? 3 : 1.5}
          strokeOpacity={0.35 + (i % 3) * 0.2}
        />
      ))}
      <circle cx="610" cy="150" r="58" fill={`url(#acc-${uid})`} />
    </g>
  ),
  rings: ({ uid, a, b, c }) => (
    <g>
      <circle cx="400" cy="300" r="320" fill={`url(#glow-${uid})`} opacity="0.3" />
      {[60, 110, 160, 210, 260].map((r, i) => (
        <circle
          key={r}
          cx="400"
          cy="300"
          r={r}
          fill="none"
          stroke={[a, b, c][i % 3]}
          strokeWidth="2"
          strokeDasharray={`${40 + i * 18} ${22 + i * 8}`}
          strokeOpacity="0.8"
        />
      ))}
      <circle cx="400" cy="300" r="26" fill={`url(#acc-${uid})`} />
    </g>
  ),
  blocks: ({ uid, a, b, c }) => (
    <g>
      <circle cx="620" cy="120" r="240" fill={`url(#glow-${uid})`} opacity="0.3" />
      {[
        [90, 110, 220, 150, a],
        [330, 110, 150, 150, b],
        [500, 110, 210, 90, c],
        [500, 220, 100, 40, a],
        [90, 280, 130, 190, b],
        [240, 280, 240, 100, `url(#acc-${uid})`],
        [240, 400, 240, 70, c],
        [500, 280, 210, 190, 'none'],
      ].map(([x, y, w, h, f], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={f}
          fillOpacity={f === 'none' ? 0 : 0.82}
          stroke="#fff"
          strokeOpacity={f === 'none' ? 0.3 : 0}
        />
      ))}
    </g>
  ),
};

export default function CoverArt({
  image,
  src,
  palette = ['#C7FF4F', '#52E5FF', '#8B5CF6'],
  variant = 'orbit',
  alt = 'Project cover preview',
  className = '',
  loading = 'lazy',
  objectFit = 'cover',
  objectPosition = 'center',
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = src || image;

  if (imgSrc && !imgFailed) {
    return (
      <img
        src={imgSrc}
        alt={alt}
        loading={loading}
        onError={() => setImgFailed(true)}
        className={`${className} object-cover`}
        style={{ objectFit, objectPosition }}
      />
    );
  }

  const [a, b, c] = palette;
  const render = variants[variant] || variants.orbit;

  return (
    <svg
      role="img"
      aria-label={alt}
      viewBox="0 0 800 600"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b0e15" />
          <stop offset="1" stopColor="#171c2b" />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={a} stopOpacity="0.9" />
          <stop offset="1" stopColor={a} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`acc-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill={`url(#bg-${uid})`} />
      {render({ uid, a, b, c })}
    </svg>
  );
}
