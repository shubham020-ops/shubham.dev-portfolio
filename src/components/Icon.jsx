import {
  ArrowRight,
  ArrowUpRight,
  Box,
  Braces,
  Code2,
  Palette,
  Sparkles,
  Wrench,
} from 'lucide-react';

const icons = { ArrowRight, ArrowUpRight, Box, Braces, Code2, Palette, Sparkles, Wrench };

/** Resolve an icon by the string name stored with a skill or focus item. */
export default function Icon({ name, size = 22, className = '', ...rest }) {
  const Cmp = icons[name] || Sparkles;
  return <Cmp size={size} className={className} aria-hidden="true" {...rest} />;
}
