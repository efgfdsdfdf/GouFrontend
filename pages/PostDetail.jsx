import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PostCard } from "../components/feed/PostCard";
import { api } from "../services/api";
export const PostDetail = () => {
    const { id } = useParams();
    const { data: post, isLoading, isError } = useQuery({
        queryKey: ["post", id],
        queryFn: () => api.posts.getById(id || ""),
        enabled: Boolean(id),
    });
    return (_jsxs("div", { className: "mx-auto w-full max-w-2xl pb-24", children: [_jsxs(Link, { to: "/", className: "mb-5 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white", children: [_jsx(ArrowLeft, { size: 18 }), "Back"] }), isLoading ? (_jsx("div", { className: "glass-panel rounded-2xl p-10 text-center text-white/45", children: "Loading post..." })) : isError || !post ? (_jsxs("div", { className: "glass-panel rounded-2xl p-10 text-center", children: [_jsx("h1", { className: "text-xl font-black text-white", children: "Post unavailable" }), _jsx("p", { className: "mt-2 text-sm text-white/45", children: "This content may have been deleted or is no longer visible." })] })) : (_jsx(PostCard, { post: post }))] }));
};
