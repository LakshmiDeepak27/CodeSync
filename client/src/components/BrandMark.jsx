import React from 'react';

/** The supplied CodeSync mark, shared across every branded surface. */
export const BrandMark = ({ size = 32, className = '' }) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#020816] ${className}`}
    style={{ width: size, height: size }}
  >
    <img
      src="/images/codesync-mark.png"
      alt=""
      aria-hidden="true"
      className="h-full w-full scale-[1.45] object-cover"
    />
  </span>
);
