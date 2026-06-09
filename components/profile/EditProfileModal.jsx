import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Save, User, FileText, School, Plus } from "lucide-react";
import { Avatar } from "../ui/Avatar";
export const EditProfileModal = ({ isOpen, onClose, onSave, initialData, isSaving = false, }) => {
    const [formData, setFormData] = useState({
        fullName: initialData?.fullName || "",
        bio: initialData?.bio || "",
        university: initialData?.university || "",
        avatarUrl: initialData?.avatarUrl || "",
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(formData.avatarUrl);
    React.useEffect(() => {
        if (!isOpen)
            return;
        const nextData = {
            fullName: initialData?.fullName || "",
            bio: initialData?.bio || "",
            university: initialData?.university || "",
            avatarUrl: initialData?.avatarUrl || "",
        };
        setFormData(nextData);
        setAvatarPreview(nextData.avatarUrl);
        setAvatarFile(null);
    }, [initialData, isOpen]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setAvatarPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, avatar: avatarFile });
    };
    return (_jsx(AnimatePresence, { children: isOpen && (_jsxs("div", { className: "fixed inset-0 z-[150] flex items-center justify-center p-4", children: [_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, onClick: () => {
                        if (!isSaving)
                            onClose();
                    }, className: "absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm" }), _jsxs(motion.div, { initial: { opacity: 0, scale: 0.95, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.95, y: 20 }, className: "relative w-full max-w-lg bg-[#141417] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden", children: [_jsxs("div", { className: "p-8 pb-4 flex items-center justify-between", children: [_jsx("h3", { className: "text-xl font-black text-white tracking-tighter", children: "Edit Profile" }), _jsx("button", { onClick: onClose, disabled: isSaving, className: "p-2 hover:bg-white/5 rounded-full text-zinc-500 transition-colors", children: _jsx(X, { size: 20 }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-8 pt-4 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar", children: [_jsxs("div", { className: "flex flex-col items-center mb-8", children: [_jsxs("div", { className: "relative group", children: [_jsxs("div", { className: "w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-primary/20 bg-white/5 relative", children: [_jsx(Avatar, { src: avatarPreview, label: formData.fullName, className: "w-full h-full object-cover", alt: "Avatar Preview" }), _jsxs("label", { className: "absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer", children: [_jsx(Camera, { className: "text-white", size: 24 }), _jsx("input", { type: "file", className: "hidden", accept: "image/*", onChange: handleAvatarChange })] })] }), _jsx("div", { className: "absolute -bottom-2 -right-2 p-1.5 bg-primary text-black rounded-xl shadow-lg", children: _jsx(Plus, { size: 16 }) })] }), _jsx("p", { className: "text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-4", children: "Change Profile Picture" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2", children: [_jsx(User, { size: 12, className: "text-primary" }), "Full Name"] }), _jsx("input", { type: "text", name: "fullName", value: formData.fullName, onChange: handleChange, placeholder: "Enter your full name", className: "w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all font-bold text-sm" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2", children: [_jsx(FileText, { size: 12, className: "text-primary" }), "Bio"] }), _jsx("textarea", { name: "bio", value: formData.bio, onChange: handleChange, placeholder: "Tell us a bit about yourself", className: "w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all font-bold text-sm h-32 resize-none" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2", children: [_jsx(School, { size: 12, className: "text-primary" }), "University"] }), _jsx("input", { type: "text", name: "university", value: formData.university, onChange: handleChange, placeholder: "Enter your university", className: "w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all font-bold text-sm" })] }), _jsxs("button", { type: "submit", disabled: isSaving, className: "w-full h-14 bg-primary text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all shadow-xl shadow-primary/20 mt-4 disabled:opacity-50", children: [_jsx(Save, { size: 18 }), _jsx("span", { children: isSaving ? "Saving..." : "Save Changes" })] })] })] })] })) }));
};
