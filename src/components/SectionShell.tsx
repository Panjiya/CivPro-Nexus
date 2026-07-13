import { useEffect, useRef, useState, type ReactNode } from 'react';

interface SectionShellProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Semantic <section> with a subtle scroll-reveal.
 * Respects prefers-reduced-motion (content appears immediately).
 */
export default function SectionShell({ id, className, children }: SectionShellProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id={id}
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className ?? ''}`}
    >
      {children}
    </section>
  );
}
