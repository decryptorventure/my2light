import React, { useState } from 'react';
import { UserPlus, Check, X, UserMinus } from 'lucide-react';
import { SocialProfile } from '../../types/social';
import { ConnectionRequestModal } from './ConnectionRequestModal';

interface PlayerCardProps {
    player: SocialProfile;
    onFollow?: (id: string) => void;
    onUnfollow?: (id: string) => void;
    onAccept?: (id: string) => void;
    onDecline?: (id: string) => void;
    variant?: 'suggestion' | 'request' | 'connection';
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    onFollow,
    onUnfollow,
    onAccept,
    onDecline,
    variant = 'suggestion'
}) => {
    const [showRequestModal, setShowRequestModal] = useState(false);

    const handleFollowClick = () => {
        setShowRequestModal(true);
    };

    const handleRequestSuccess = () => {
        onFollow?.(player.id);
        setShowRequestModal(false);
    };

    return (
        <>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-slate-700 overflow-hidden border-2 border-slate-600">
                        {player.avatarUrl ? (
                            <img src={player.avatarUrl} alt={player.fullName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                                {player.fullName?.charAt(0)}
                            </div>
                        )}
                    </div>
                    {/* Online Indicator (Mock) */}
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-800"></div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold truncate">{player.fullName}</h4>
                    <p className="text-lime-400 text-xs font-medium mb-0.5">{player.skillLevel}</p>
                    <p className="text-slate-400 text-xs truncate">
                        {player.followersCount} người theo dõi
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {variant === 'suggestion' && onFollow && (
                        <button
                            onClick={handleFollowClick}
                            className="p-2 rounded-lg bg-lime-400/10 text-lime-400 hover:bg-lime-400 hover:text-slate-900 transition-all"
                        >
                            <UserPlus size={20} />
                        </button>
                    )}

                    {variant === 'request' && (
                        <>
                            <button
                                onClick={() => onAccept?.(player.id)}
                                className="p-2 rounded-lg bg-lime-400/10 text-lime-400 hover:bg-lime-400 hover:text-slate-900 transition-all"
                            >
                                <Check size={20} />
                            </button>
                            <button
                                onClick={() => onDecline?.(player.id)}
                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </>
                    )}

                    {variant === 'connection' && onUnfollow && (
                        <button
                            onClick={() => onUnfollow(player.id)}
                            className="p-2 rounded-lg bg-slate-700 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
                        >
                            <UserMinus size={20} />
                        </button>
                    )}
                </div>
            </div>

            <ConnectionRequestModal
                targetUserId={player.id}
                targetUserName={player.fullName}
                targetUserAvatar={player.avatarUrl}
                isOpen={showRequestModal}
                onClose={() => setShowRequestModal(false)}
                onSuccess={handleRequestSuccess}
            />
        </>
    );
};
