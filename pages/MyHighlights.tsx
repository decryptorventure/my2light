import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Play, Globe, Lock, Trash2, Share2, Download,
    Edit3, MoreVertical, Grid3x3, List, SlidersHorizontal,
    TrendingUp, Clock, Heart, Eye, Plus, Camera, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '../components/Layout/PageTransition';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCircle } from '../components/ui/CircularProgress';
import { ApiService } from '../services/api';
import { Highlight, User } from '../types';
import { celebrate } from '../lib/confetti';

type ViewMode = 'grid' | 'list';
type SortBy = 'recent' | 'popular' | 'oldest';
type FilterBy = 'all' | 'public' | 'private';

export const MyHighlights: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortBy>('recent');
    const [filterBy, setFilterBy] = useState<FilterBy>('all');
    const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
    const [showActionsMenu, setShowActionsMenu] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [userRes, highlightsRes] = await Promise.all([
                ApiService.getCurrentUser(),
                ApiService.getHighlights(50)
            ]);

            if (userRes.success) setUser(userRes.data);
            if (highlightsRes.success) {
                const myHighlights = highlightsRes.data.filter(h => h.userId === userRes.data?.id);
                setHighlights(myHighlights);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <LoadingSpinner fullScreen />;

    const publicCount = highlights.filter(h => h.isPublic).length;
    const privateCount = highlights.length - publicCount;
    const totalViews = highlights.reduce((sum, h) => sum + (h.views || 0), 0);
    const totalLikes = highlights.reduce((sum, h) => sum + h.likes, 0);

    // Filter highlights
    let filteredHighlights = highlights;
    if (filterBy === 'public') filteredHighlights = highlights.filter(h => h.isPublic);
    if (filterBy === 'private') filteredHighlights = highlights.filter(h => !h.isPublic);

    // Sort highlights
    const sortedHighlights = [...filteredHighlights].sort((a, b) => {
        if (sortBy === 'recent') return b.id.localeCompare(a.id);
        if (sortBy === 'popular') return (b.views || 0) - (a.views || 0);
        if (sortBy === 'oldest') return a.id.localeCompare(b.id);
        return 0;
    });

    const handleDeleteHighlight = async (highlightId: string) => {
        if (confirm('Xóa highlight này?')) {
            setHighlights(prev => prev.filter(h => h.id !== highlightId));
            setShowActionsMenu(false);
            // API call here
        }
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-900 pb-24">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 pt-safe">
                    <div className="flex items-center justify-between p-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-lg font-black">Thư Viện Của Tôi</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/self-recording')}
                        >
                            <Plus size={24} />
                        </Button>
                    </div>
                </div>

                {/* Profile Section */}
                <div className="px-6 py-6 border-b border-slate-800">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <img
                                src={user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3307/3307873.png'}
                                alt={user?.name}
                                className="w-20 h-20 rounded-full object-cover ring-4 ring-lime-400/30"
                            />
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center border-4 border-slate-900">
                                <Camera size={14} className="text-slate-900" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-black text-white mb-1">{user?.name}</h2>
                            <p className="text-slate-400 text-sm">@{user?.name?.toLowerCase().replace(/\s+/g, '')}</p>
                        </div>
                    </div>

                    {/* Stats - Circular Progress */}
                    <div className="grid grid-cols-4 gap-3">
                        <StatCircle
                            icon={<Play size={16} />}
                            label="Videos"
                            value={highlights.length}
                            max={50}
                            color="primary"
                            size={80}
                        />
                        <StatCircle
                            icon={<Eye size={16} />}
                            label="Lượt xem"
                            value={totalViews}
                            max={1000}
                            color="info"
                            size={80}
                        />
                        <StatCircle
                            icon={<Heart size={16} />}
                            label="Lượt thích"
                            value={totalLikes}
                            max={500}
                            color="error"
                            size={80}
                        />
                        <StatCircle
                            icon={<Globe size={16} />}
                            label="Công khai"
                            value={publicCount}
                            max={highlights.length || 1}
                            color="success"
                            size={80}
                        />
                    </div>
                </div>

                {/* Filters & View Toggle */}
                <div className="sticky top-[72px] z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Filter chips */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {(['all', 'public', 'private'] as FilterBy[]).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setFilterBy(filter)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${filterBy === filter
                                        ? 'bg-lime-400 text-slate-900'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {filter === 'all' ? 'Tất cả' : filter === 'public' ? 'Công khai' : 'Riêng tư'}
                                </button>
                            ))}
                        </div>

                        {/* View & Sort */}
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortBy)}
                                className="bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border-0 focus:ring-2 focus:ring-lime-400"
                            >
                                <option value="recent">Mới nhất</option>
                                <option value="popular">Phổ biến</option>
                                <option value="oldest">Cũ nhất</option>
                            </select>

                            <button
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700"
                            >
                                {viewMode === 'grid' ? <List size={20} /> : <Grid3x3 size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Highlights Content */}
                <div className="p-4">
                    {sortedHighlights.length === 0 ? (
                        <EmptyState
                            hasHighlights={highlights.length > 0}
                            filterBy={filterBy}
                            onCreateNew={() => navigate('/self-recording')}
                            onResetFilter={() => setFilterBy('all')}
                        />
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-1' : 'space-y-3'}>
                            {sortedHighlights.map((highlight, index) => (
                                <HighlightItem
                                    key={highlight.id}
                                    highlight={highlight}
                                    viewMode={viewMode}
                                    index={index}
                                    onAction={(action) => {
                                        setSelectedHighlight(highlight);
                                        if (action === 'delete') handleDeleteHighlight(highlight.id);
                                        else if (action === 'menu') setShowActionsMenu(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions Menu Modal */}
                <AnimatePresence>
                    {showActionsMenu && selectedHighlight && (
                        <ActionsMenu
                            highlight={selectedHighlight}
                            onClose={() => setShowActionsMenu(false)}
                            onDelete={() => handleDeleteHighlight(selectedHighlight.id)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
};

// Empty State Component
const EmptyState: React.FC<{
    hasHighlights: boolean;
    filterBy: FilterBy;
    onCreateNew: () => void;
    onResetFilter: () => void;
}> = ({ hasHighlights, filterBy, onCreateNew, onResetFilter }) => (
    <div className="text-center py-20 px-6 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-full flex items-center justify-center"
        >
            <Play size={48} className="text-slate-600" />
        </motion.div>

        {hasHighlights && filterBy !== 'all' ? (
            <>
                <h3 className="text-lg font-bold text-white mb-2">
                    Không có highlight {filterBy === 'public' ? 'công khai' : 'riêng tư'}
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                    Thử bộ lọc khác hoặc tạo highlight mới
                </p>
                <Button variant="outline" onClick={onResetFilter}>
                    Xem tất cả
                </Button>
            </>
        ) : (
            <>
                <h3 className="text-lg font-bold text-white mb-2">Chưa có highlight nào</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Bắt đầu quay video để tạo highlight đầu tiên của bạn
                </p>
                <Button icon={<Camera size={20} />} onClick={onCreateNew}>
                    Tạo highlight mới
                </Button>
            </>
        )}
    </div>
);

// Highlight Item Component
const HighlightItem: React.FC<{
    highlight: Highlight;
    viewMode: ViewMode;
    index: number;
    onAction: (action: string) => void;
}> = ({ highlight, viewMode, index, onAction }) => {
    const [isPublic, setIsPublic] = useState(highlight.isPublic !== false);
    const navigate = useNavigate();

    const togglePrivacy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const newPrivacy = !isPublic;
        setIsPublic(newPrivacy);
        await ApiService.updateHighlightPrivacy(highlight.id, newPrivacy);
        if (newPrivacy) celebrate({ particleCount: 20 });
    };

    if (viewMode === 'list') {
        return (
            <Card
                interactive
                className="p-4 flex gap-4"
                onClick={() => navigate('/gallery')}
            >
                <div className="w-24 h-32 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={highlight.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h4 className="font-bold text-white mb-1">Highlight #{index + 1}</h4>
                            <p className="text-xs text-slate-400">{highlight.courtName}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onAction('menu'); }}
                            className="p-2 hover:bg-slate-800 rounded-lg"
                        >
                            <MoreVertical size={18} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                            <Eye size={14} />
                            {highlight.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <Heart size={14} />
                            {highlight.likes}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageCircle size={14} />
                            {highlight.comments || 0}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock size={14} />
                            00:{highlight.durationSec}
                        </span>
                    </div>
                </div>
            </Card>
        );
    }

    // Grid view
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/gallery')}
            className="relative aspect-[9/16] bg-slate-800 rounded-lg overflow-hidden cursor-pointer group"
        >
            <img src={highlight.thumbnailUrl} alt="" className="w-full h-full object-cover" />

            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity" />

            <button
                onClick={togglePrivacy}
                className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md z-10 ${isPublic ? 'bg-lime-500/30 text-lime-400' : 'bg-slate-800/60 text-slate-300'
                    }`}
            >
                {isPublic ? <Globe size={14} /> : <Lock size={14} />}
            </button>

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full">
                        <Heart size={10} className="fill-white" />
                        {highlight.likes}
                    </div>
                    <div className="flex items-center gap-1 text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full">
                        <MessageCircle size={10} className="fill-white" />
                        {highlight.comments || 0}
                    </div>
                </div>
                <div className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full">
                    {highlight.views || 0} views
                </div>
            </div>
        </motion.div>
    );
};

// Actions Menu Component
const ActionsMenu: React.FC<{
    highlight: Highlight;
    onClose: () => void;
    onDelete: () => void;
}> = ({ highlight, onClose, onDelete }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end z-50"
        onClick={onClose}
    >
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-full bg-slate-900 rounded-t-3xl p-6 pb-safe"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6" />

            <div className="space-y-2">
                <ActionButton icon={<Edit3 size={20} />} label="Chỉnh sửa" />
                <ActionButton icon={<Share2 size={20} />} label="Chia sẻ" />
                <ActionButton icon={<Download size={20} />} label="Tải về" />
                <ActionButton icon={<Trash2 size={20} />} label="Xóa" danger onClick={onDelete} />
            </div>

            <Button variant="ghost" className="w-full mt-4" onClick={onClose}>
                Hủy
            </Button>
        </motion.div>
    </motion.div>
);

const ActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    danger?: boolean;
    onClick?: () => void;
}> = ({ icon, label, danger, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800 transition-colors ${danger ? 'text-red-500' : 'text-white'
            }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);
