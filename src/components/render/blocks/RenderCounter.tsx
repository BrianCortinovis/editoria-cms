'use client';

import { useEffect, useRef, useState } from 'react';
import type { Block } from '@/lib/types/block';

interface CounterItem {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

interface Props {
  block: Block;
  style: React.CSSProperties;
}

export function RenderCounter({ block, style }: Props) {
  const items = (block.props.items as CounterItem[]) || [];
  const duration = (block.props.duration as number) || 2000;
  const columns = (block.props.columns as number) || items.length;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '2rem',
        textAlign: 'center',
      }}
      data-block="counter"
    >
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ fontFamily: 'var(--e-font-heading)', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--e-color-primary, #8B0000)' }}>
            {item.prefix || ''}
            <AnimatedNumber target={item.value} duration={duration} animate={visible} />
            {item.suffix || ''}
          </div>
          <div style={{ marginTop: '0.5rem', color: 'var(--e-color-textSecondary)', fontSize: '0.9rem' }}>
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnimatedNumber({ target, duration, animate }: { target: number; duration: number; animate: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!animate) return;
    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [animate, target, duration]);

  return <>{animate ? current : 0}</>;
}
