import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
    Award,
    Calendar,
    Camera,
    Copy,
    Crown,
    Edit3,
    Save,
    Settings,
    Share2,
    TrendingUp,
    Users,
    X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';

interface ProfileData {
    bio?: string;
    avatar_url?: string;
    is_verified?: boolean;
    referral_count?: number;
    total_rewards?: number;
    last_active?: string;
    created_at?: string;
}

export const Profile: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [profileData, setProfileData] = useState<ProfileData>({});
    const [isEditing, setIsEditing] = useState(false);
    const [editedBio, setEditedBio] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user) {
            loadProfileData();
        }
    }, [user]);

    const loadProfileData = async () => {
        if (!user?.username) return;

        setIsLoading(true);
        try {
            const [profile, referralInfo] = await Promise.all([
                apiClient.getUserProfile(user.username),
                apiClient.getReferralInfo()
            ]);

            setProfileData({
                bio: profile.bio,
                avatar_url: profile.avatar_url,
                is_verified: profile.is_verified,
                referral_count: profile.referral_count,
                total_rewards: referralInfo.total_rewards,
                last_active: profile.last_active,
                created_at: profile.created_at
            });
            setEditedBio(profile.bio || '');
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const updatedProfile = await apiClient.updateProfile({
                bio: editedBio
            });

            setProfileData(prev => ({
                ...prev,
                bio: updatedProfile.bio
            }));

            if (updateUser) {
                updateUser(updatedProfile);
            }

            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedBio(profileData.bio || '');
        setIsEditing(false);
    };

    const handleCopyReferralCode = async () => {
        if (!user?.username) return;

        const referralLink = `https://aptora.com/ref/${user.username}`;
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const getReferralTier = (count: number) => {
        if (count >= 50) return { name: 'Platinum', color: 'text-purple-400', commission: '30%' };
        if (count >= 30) return { name: 'Gold', color: 'text-warning', commission: '25%' };
        if (count >= 15) return { name: 'Silver', color: 'text-muted', commission: '20%' };
        if (count >= 5) return { name: 'Bronze', color: 'text-orange-400', commission: '15%' };
        return { name: 'Starter', color: 'text-muted', commission: '10%' };
    };

    const referralTier = getReferralTier(profileData.referral_count || 0);

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted">Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-default mb-2">Profile</h1>
                    <p className="text-muted">
                        Manage your profile and view your social statistics.
                    </p>
                </div>
                <Button variant="ghost" icon={Settings}>
                    Settings
                </Button>
            </div>

            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary/20 via-accent/20 to-purple-500/20 rounded-2xl p-6 border border-primary/30"
            >
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-black font-bold text-3xl">
                            {user?.username?.slice(0, 2).toUpperCase()}
                        </div>
                        {profileData.is_verified && (
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <Crown className="w-5 h-5 text-black" />
                            </div>
                        )}
                        <button className="absolute bottom-0 right-0 w-8 h-8 bg-surface-700 rounded-full flex items-center justify-center border border-surface-600 hover:border-primary transition-colors">
                            <Camera className="w-4 h-4 text-muted" />
                        </button>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-text-default">@{user?.username}</h2>
                            {profileData.is_verified && (
                                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                    Verified
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted mb-3">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Member since {profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                Last active {profileData.last_active ? new Date(profileData.last_active).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="primary"
                                onClick={handleCopyReferralCode}
                                icon={Copy}
                            >
                                {copied ? 'Copied!' : 'Copy Referral Code'}
                            </Button>
                            <Button variant="secondary" icon={Share2}>
                                Share Profile
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Bio Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface-700 rounded-xl p-6 border border-surface-600"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-default">Bio</h3>
                    {!isEditing ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            icon={Edit3}
                        >
                            Edit
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveProfile}
                                icon={Save}
                                disabled={isLoading}
                            >
                                Save
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                                icon={X}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <textarea
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="w-full h-24 p-3 bg-surface-800 border border-surface-600 rounded-lg text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    />
                ) : (
                    <p className="text-muted">
                        {profileData.bio || "No bio added yet. Click edit to add your bio."}
                    </p>
                )}
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted">Total Referred</span>
                    </div>
                    <div className="text-2xl font-bold text-text-default">
                        {profileData.referral_count || 0}
                    </div>
                </div>

                <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-success" />
                        <span className="text-sm text-muted">Total Earned</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-success">
                        ${(profileData.total_rewards || 0).toFixed(2)}
                    </div>
                </div>

                <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
                    <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-4 h-4 text-warning" />
                        <span className="text-sm text-muted">Current Tier</span>
                    </div>
                    <div className={clsx("text-xl font-bold", referralTier.color)}>
                        {referralTier.name}
                    </div>
                </div>

                <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-accent" />
                        <span className="text-sm text-muted">Commission Rate</span>
                    </div>
                    <div className="text-xl font-bold text-accent">
                        {referralTier.commission}
                    </div>
                </div>
            </motion.div>

            {/* Referral Progress */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface-700 rounded-xl p-6 border border-surface-600"
            >
                <h3 className="text-lg font-semibold text-text-default mb-4">Referral Progress</h3>

                <div className="space-y-4">
                    {[
                        { name: 'Bronze', requirement: 5, current: profileData.referral_count || 0 },
                        { name: 'Silver', requirement: 15, current: profileData.referral_count || 0 },
                        { name: 'Gold', requirement: 30, current: profileData.referral_count || 0 },
                        { name: 'Platinum', requirement: 50, current: profileData.referral_count || 0 }
                    ].map((tier, index) => {
                        const progress = Math.min((profileData.referral_count || 0) / tier.requirement * 100, 100);
                        const isCompleted = (profileData.referral_count || 0) >= tier.requirement;
                        const isCurrent = index === 0 ? (profileData.referral_count || 0) < 5 :
                            index === 1 ? (profileData.referral_count || 0) >= 5 && (profileData.referral_count || 0) < 15 :
                                index === 2 ? (profileData.referral_count || 0) >= 15 && (profileData.referral_count || 0) < 30 :
                                    (profileData.referral_count || 0) >= 30 && (profileData.referral_count || 0) < 50;

                        return (
                            <div key={tier.name} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className={clsx(
                                        "font-medium text-sm",
                                        isCompleted ? "text-success" : isCurrent ? "text-primary" : "text-muted"
                                    )}>
                                        {tier.name} Tier
                                        {isCurrent && <span className="ml-2 text-xs">(Current)</span>}
                                        {isCompleted && <span className="ml-2 text-xs">✓</span>}
                                    </span>
                                    <span className="text-sm text-muted">
                                        {profileData.referral_count || 0}/{tier.requirement} referrals
                                    </span>
                                </div>
                                <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                                        className={clsx(
                                            "h-full transition-all",
                                            isCompleted ? "bg-success" : isCurrent ? "bg-primary" : "bg-surface-600"
                                        )}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-surface-700 rounded-xl p-6 border border-surface-600"
            >
                <h3 className="text-lg font-semibold text-text-default mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="primary" icon={Share2} className="w-full">
                        Share Profile
                    </Button>
                    <Button variant="secondary" icon={Users} className="w-full">
                        Invite Friends
                    </Button>
                    <Button variant="ghost" icon={Award} className="w-full">
                        View Rewards
                    </Button>
                    <Button variant="ghost" icon={Settings} className="w-full">
                        Settings
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};
