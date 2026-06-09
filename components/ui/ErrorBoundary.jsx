import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { Component } from "react";
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            hasError: false,
            error: null,
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsx("div", { className: "min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4", children: _jsxs("div", { className: "bg-[#141417] p-8 rounded-[2rem] border border-white/10 max-w-md w-full text-center", children: [_jsx("h2", { className: "text-xl font-black mb-4", children: "Something went wrong." }), _jsx("p", { className: "text-zinc-400 mb-6 text-sm", children: this.state.error?.message || "An unexpected error occurred." }), _jsx("button", { onClick: () => window.location.reload(), className: "px-6 py-3 bg-primary text-black font-black uppercase text-xs tracking-widest rounded-xl w-full", children: "Refresh Page" })] }) }));
        }
        return this.props.children;
    }
}
