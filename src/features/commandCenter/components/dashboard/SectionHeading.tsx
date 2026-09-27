import React from 'react';

/**
 * Shared section eyebrow heading for Dashboard 2.0. Rendered as a semantic
 * heading so assistive tech can navigate the command center by section.
 */
export const SectionHeading: React.FC<{
  level?: 2 | 3;
  title: string;
  className?: string;
  id?: string;
}> = ({ level = 2, title, className = '', id }) => {
  const Tag = `h${level}` as 'h2' | 'h3';
  return (
    <Tag
      id={id}
      className={`text-xs font-extrabold tracking-[0.14em] text-[#5A6B63] dark:text-[var(--yj-text-3)] ${className}`}
    >
      {title}
    </Tag>
  );
};

/** Subtle entrance animation; disabled automatically under reduced motion. */
export const ENTRANCE = 'motion-safe:animate-[yj-dash-rise_0.5s_ease-out_both]';

export default SectionHeading;
