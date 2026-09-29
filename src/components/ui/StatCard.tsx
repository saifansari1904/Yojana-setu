import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  valuePrefix?: string;
  valueSuffix?: string;
  description?: React.ReactNode;
  onActionClick?: () => void;
  actionLabel?: string;
  trend?: number[]; // Mini bar chart data (0-100 values)
  accentColor?: string;
}

/**
 * STAT CARD — 21st.dev-inspired design, lightweight implementation.
 *
 * Features:
 * - Animated count-up number (CSS + rAF, no framer-motion)
 * - Optional mini bar chart with staggered entrance
 * - Hover lift effect
 * - Optional action chevron
 *
 * No new dependencies. Uses Tailwind + the project's yj-* design tokens.
 */
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  valuePrefix = '',
  valueSuffix = '',
  description,
  onActionClick,
  actionLabel,
  trend,
  accentColor = '#1E6A50',
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection observer for entrance animation
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Count-up animation
  useEffect(() => {
    if (!inView) return;
    const duration = 800;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  const HeaderElement = onActionClick ? 'button' : 'div';

  return (
    <div
      ref={ref}
      className="yj-card group overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <HeaderElement
        onClick={onActionClick}
        className={`flex w-full items-center justify-between text-left ${
          onActionClick ? 'cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14453D]' : ''
        }`}
        aria-label={onActionClick && actionLabel ? actionLabel : undefined}
      >
        <h3 className="text-sm font-medium text-[#5A6B63] dark:text-[var(--yj-text-3)]">
          {title}
        </h3>
        {onActionClick && (
          <ChevronRight
            className="h-4 w-4 text-[#8A9A92] transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        )}
      </HeaderElement>

      <div className="mt-2">
        <p className="text-3xl font-bold tracking-tight text-[#14453D] dark:text-[var(--yj-text-1)]">
          {valuePrefix}
          {displayValue.toLocaleString('en-IN')}
          {valueSuffix}
        </p>
        {description && (
          <p className="mt-1 text-sm text-[#5A6B63] dark:text-[var(--yj-text-3)]">
            {description}
          </p>
        )}
      </div>

      {trend && trend.length > 0 && (
        <div
          className="mt-4 flex h-16 items-end gap-1.5"
          role="img"
          aria-label={`${title} trend chart`}
        >
          {trend.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t transition-all duration-500"
              style={{
                height: inView ? `${Math.max(v, 4)}%` : '0%',
                backgroundColor: i === trend.length - 1 ? accentColor : `${accentColor}33`,
                transitionDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
