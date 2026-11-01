/**
 * Splits text into per-character spans for GSAP. The visible characters are
 * aria-hidden and the full string is exposed once to assistive tech.
 */
export default function SplitText({ text, charClass = 'char', className = '' }) {
  const safeText = typeof text === 'string' ? text : String(text ?? '');
  return (
    <>
      <span className="sr-only">{safeText}</span>
      <span aria-hidden="true" className={className}>
        {safeText.split(/(\s+)/u).map((part, wordIndex) => (
          /^\s+$/u.test(part) ? (
            <span key={`space-${wordIndex}`}>{part}</span>
          ) : (
            <span key={`word-${wordIndex}`} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
              {Array.from(part).map((ch, charIndex) => (
                <span key={charIndex} className={charClass} style={{ display: 'inline-block' }}>
                  {ch}
                </span>
              ))}
            </span>
          )
        ))}
      </span>
    </>
  );
}
