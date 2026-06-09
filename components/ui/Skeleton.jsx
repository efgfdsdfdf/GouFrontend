import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
export const Skeleton = ({ className = '' }) => {
    return (_jsx("div", { className: `bg-white/5 animate-pulse rounded-lg ${className}` }));
};
