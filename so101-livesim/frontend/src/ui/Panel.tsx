import React from "react";

interface PanelProps {
  /** Panel header title (uppercased automatically via CSS). */
  title?: string;
  /** Additional class on the outer wrapper. */
  className?: string;
  children: React.ReactNode;
}

/**
 * Nano Banana double-border HUD panel.
 *
 * Structure:
 *   .hud-panel          — outer dark outline (#2f2f2f), 12px radius, 4px padding
 *     .hud-panel-inner  — inner teal outline (#4b99b7), 10px radius
 *       .hud-header     — title + 3-dot menu  (only if title provided)
 *       .hud-body       — content slot
 */
export default function Panel({ title, className = "", children }: PanelProps) {
  return (
    <div className={`hud-panel ${className}`}>
      <div className="hud-panel-inner">
        {title && (
          <div className="hud-header">
            <span className="hud-title">{title}</span>
            <div className="hud-dots">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div className="hud-body">{children}</div>
      </div>
    </div>
  );
}
