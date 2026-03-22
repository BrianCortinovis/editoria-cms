/**
 * Animation runtime for entrance, scroll, and hover-driven animations
 * This script is embedded in exported HTML to handle animations without dependencies
 */

export function initializeAnimations() {
  const effectKeyframes: Record<string, { start: string; end: string }> = {
    'fade-in': {
      start: 'opacity: 0;',
      end: 'opacity: 1;',
    },
    'slide-up': {
      start: 'opacity: 0; transform: translateY(40px);',
      end: 'opacity: 1; transform: translateY(0);',
    },
    'slide-down': {
      start: 'opacity: 0; transform: translateY(-40px);',
      end: 'opacity: 1; transform: translateY(0);',
    },
    'slide-left': {
      start: 'opacity: 0; transform: translateX(40px);',
      end: 'opacity: 1; transform: translateX(0);',
    },
    'slide-right': {
      start: 'opacity: 0; transform: translateX(-40px);',
      end: 'opacity: 1; transform: translateX(0);',
    },
    'zoom-in': {
      start: 'opacity: 0; transform: scale(0.9);',
      end: 'opacity: 1; transform: scale(1);',
    },
    'zoom-out': {
      start: 'opacity: 0; transform: scale(1.1);',
      end: 'opacity: 1; transform: scale(1);',
    },
    'rotate': {
      start: 'opacity: 0; transform: rotate(-10deg);',
      end: 'opacity: 1; transform: rotate(0deg);',
    },
    'bounce': {
      start: 'opacity: 0; transform: translateY(20px);',
      end: 'opacity: 1; transform: translateY(0); animation: bounce 0.6s ease-out;',
    },
    'flip': {
      start: 'opacity: 0; transform: rotateY(90deg);',
      end: 'opacity: 1; transform: rotateY(0deg);',
    },
  };

  // Inject bounce keyframes if needed
  const style = document.createElement('style');
  style.setAttribute('data-runtime-animations', 'true');
  style.textContent = `
    @keyframes fade-in {
      from { ${effectKeyframes['fade-in'].start} }
      to { ${effectKeyframes['fade-in'].end} }
    }
    @keyframes slide-up {
      from { ${effectKeyframes['slide-up'].start} }
      to { ${effectKeyframes['slide-up'].end} }
    }
    @keyframes slide-down {
      from { ${effectKeyframes['slide-down'].start} }
      to { ${effectKeyframes['slide-down'].end} }
    }
    @keyframes slide-left {
      from { ${effectKeyframes['slide-left'].start} }
      to { ${effectKeyframes['slide-left'].end} }
    }
    @keyframes slide-right {
      from { ${effectKeyframes['slide-right'].start} }
      to { ${effectKeyframes['slide-right'].end} }
    }
    @keyframes zoom-in {
      from { ${effectKeyframes['zoom-in'].start} }
      to { ${effectKeyframes['zoom-in'].end} }
    }
    @keyframes zoom-out {
      from { ${effectKeyframes['zoom-out'].start} }
      to { ${effectKeyframes['zoom-out'].end} }
    }
    @keyframes rotate {
      from { ${effectKeyframes.rotate.start} }
      to { ${effectKeyframes.rotate.end} }
    }
    @keyframes flip {
      from { ${effectKeyframes.flip.start} }
      to { ${effectKeyframes.flip.end} }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);

  // Handle entrance animations
  const entranceElements = document.querySelectorAll('[data-animate="entrance"]');
  entranceElements.forEach((el) => {
    const effect = el.getAttribute('data-effect') || 'fade-in';
    const duration = parseInt(el.getAttribute('data-duration') || '600');
    const delay = parseInt(el.getAttribute('data-delay') || '0');
    const easing = el.getAttribute('data-easing') || 'ease-out';

    // Trigger on page load after delay
    setTimeout(() => {
      (el as HTMLElement).style.animation = `${effect} ${duration}ms ${easing} forwards`;
    }, delay);
  });

  // Handle scroll-driven animations
  const scrollElements = document.querySelectorAll('[data-animate="scroll"]');
  const observerOptions = {
    threshold: 0.5, // trigger when 50% visible
    rootMargin: '0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const effect = entry.target.getAttribute('data-effect') || 'fade-in';
        const duration = parseInt(entry.target.getAttribute('data-duration') || '600');
        const delay = parseInt(entry.target.getAttribute('data-delay') || '0');
        const easing = entry.target.getAttribute('data-easing') || 'ease-out';

        setTimeout(() => {
          (entry.target as HTMLElement).style.animation = `${effect} ${duration}ms ${easing} forwards`;
        }, delay);

        // Stop observing after animation
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  scrollElements.forEach((el) => observer.observe(el));

  // Handle hover animations
  const hoverElements = document.querySelectorAll('[data-animate="hover"]');
  const hoverCleanups: Array<() => void> = [];
  hoverElements.forEach((el) => {
    const effect = el.getAttribute('data-effect') || 'zoom-in';
    const duration = parseInt(el.getAttribute('data-duration') || '300');
    const easing = el.getAttribute('data-easing') || 'ease-out';

    const onEnter = () => {
      (el as HTMLElement).style.animation = `${effect} ${duration}ms ${easing} forwards`;
    };

    const onLeave = () => {
      (el as HTMLElement).style.animation = 'none';
    };

    (el as HTMLElement).addEventListener('mouseenter', onEnter);
    (el as HTMLElement).addEventListener('mouseleave', onLeave);
    hoverCleanups.push(() => {
      (el as HTMLElement).removeEventListener('mouseenter', onEnter);
      (el as HTMLElement).removeEventListener('mouseleave', onLeave);
    });
  });

  return () => {
    observer.disconnect();
    hoverCleanups.forEach((cleanup) => cleanup());
    style.remove();
  };
}
