import React from 'react';
import { motion } from 'framer-motion';
import { Play, Plus } from 'lucide-react';

interface Story {
    id: string;
    thumbnail: string;
    views: number;
    isNew?: boolean;
}

export const Stories: React.FC = () => {
    // Mock data
    const stories: Story[] = [
        { id: '1', thumbnail: 'https://images.unsplash.com/photo-1626224583764-847649623dbb?w=400', views: 120, isNew: true },
        { id: '2', thumbnail: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=400', views: 85, isNew: true },
        { id: '3', thumbnail: 'https://images.unsplash.com/photo-1554068865-2484cd0088fa?w=400', views: 340 },
        { id: '4', thumbnail: 'https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=400', views: 56 },
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-1">
            {/* Add Story Button */}
            <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center bg-slate-800 flex-shrink-0 cursor-pointer hover:border-lime-400 transition-colors">
                    <Plus size={24} className="text-lime-400" />
                </div>
                <span className="text-[10px] text-slate-400">Tạo mới</span>
            </div>

            {stories.map((story) => (
                <motion.div
                    key={story.id}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                    <div className={`w-16 h-16 rounded-full p-[2px] ${story.isNew ? 'bg-gradient-to-tr from-lime-400 to-green-600' : 'bg-slate-700'}`}>
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-900 relative">
                            <img src={story.thumbnail} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={16} className="text-white fill-white" />
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] text-slate-400">{story.views} views</span>
                </motion.div>
            ))}
        </div>
    );
};
