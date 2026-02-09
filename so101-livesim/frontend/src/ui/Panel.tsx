import React from "react";

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

/** Reusable panel card matching the reference design. */
export default function Panel({ title, children, className = "" }: PanelProps) {
  return (
    <div className={`panel ${className}`}>
      <div className="panel-header">{title}</div>
      <div className="panel-body">{children}</div>
    </div>
  );
}
