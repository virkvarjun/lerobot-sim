import React from "react";

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/** Reusable panel card with double-border and header ellipsis icon. */
export default function Panel({ title, children, className = "" }: PanelProps) {
  return (
    <div className={`panel ${className}`}>
      <div className="panel-header">
        <span>{title}</span>
        <div className="panel-header-dots">
          <span /><span /><span />
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </div>
  );
}
