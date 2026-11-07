import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function KaTeXView({ math, displayMode = false, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode,
          throwOnError: false,
        });
      } catch (err) {
        containerRef.current.innerText = math;
      }
    }
  }, [math, displayMode]);

  return <span ref={containerRef} className={`inline-block ${className}`} />;
}
