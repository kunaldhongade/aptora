import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
    Award,
    Crown,
    Heart,
    Search,
    Share2,
    TrendingUp,
    UserMinus,
    UserPlus,
    Users
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { CardLoading } from '../components/ui/LoadingAnimation';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, ReferralLeaderboardEntry } from '../lib/api';

interface User {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar_url?: string;
    is_verified?: boolean;
    referral_count?: number;
    total_rewards?: number;
    last_active?: string;
}

export const Social: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'discover' | 'followers' | 'following' | 'leaderboard'>('discover');
    const [isLoading, setIsLoading] = useState(false);

    const loadSocialData = useCallback(async () => {
        if (!user?.username) return;

        setIsLoading(true);
        try {
            const [followersData, followingData, leaderboardData, allUsersData] = await Promise.all([
                apiClient.getFollowers(user.username),
                apiClient.getFollowing(user.username),
                apiClient.getReferralLeaderboard(10), // Load fewer for leaderboard
                apiClient.getAllUsers(50, 0) // Load all users for discovery
            ]);

            setFollowers(followersData);
            setFollowing(followingData);
            setLeaderboard(leaderboardData);

            // Use all users for discovery section, excluding current user
            const discoverUsers = allUsersData
                .filter(u => u.username !== user.username) // Exclude current user
                .map(userProfile => ({
                    id: userProfile.id,
                    username: userProfile.username,
                    email: userProfile.email,
                    bio: (userProfile as any).bio || 'New trader on Aptora',
                    avatar_url: (userProfile as any).avatar_url,
                    is_verified: (userProfile as any).is_verified || false,
                    referral_count: (userProfile as any).referral_count || 0,
                    total_rewards: (userProfile as any).total_rewards || 0,
                    last_active: (userProfile as any).last_active
                }));
            setUsers(discoverUsers);
        } catch (error) {
            console.error('Failed to load social data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user?.username) {
            loadSocialData();
        }
    }, [user, loadSocialData]);

    const handleFollow = async (username: string) => {
        // Prevent self-follow
        if (username === user?.username) {
            console.error('Cannot follow yourself');
            return;
        }

        try {
            await apiClient.followUser(username);
            await loadSocialData(); // Refresh data
        } catch (error) {
            console.error('Failed to follow user:', error);
            // TODO: Add toast notification for error
        }
    };

    const handleUnfollow = async (username: string) => {
        try {
            await apiClient.unfollowUser(username);
            await loadSocialData(); // Refresh data
        } catch (error) {
            console.error('Failed to unfollow user:', error);
            // TODO: Add toast notification for error
        }
    };

    const isFollowing = (username: string) => {
        return following.some(u => u.username === username);
    };

    // Filter users based on search term and exclude current user
    const filteredUsers = users.filter(userProfile =>
        userProfile.username !== user?.username && // Exclude current user
        (userProfile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (userProfile.bio && userProfile.bio.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const renderUserCard = (userProfile: User, showFollowButton: boolean = true) => (
        <motion.div
            key={userProfile.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-700 rounded-xl p-4 border border-surface-600 hover:border-primary/50 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary rounded-full flex items-center justify-center text-black font-bold text-lg shadow-glow">
                        {userProfile.username.slice(0, 2).toUpperCase()}
                    </div>
                    {userProfile.is_verified && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-black" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text-default truncate">@{userProfile.username}</h3>
                        {userProfile.is_verified && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                                Verified
                            </span>
                        )}
                    </div>

                    {userProfile.bio && (
                        <p className="text-sm text-muted line-clamp-2 mb-2">{userProfile.bio}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted">
                        {userProfile.referral_count !== undefined && (
                            <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {userProfile.referral_count} referrals
                            </span>
                        )}
                        {userProfile.total_rewards !== undefined && (
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                ${userProfile.total_rewards.toFixed(2)} earned
                            </span>
                        )}
                        {userProfile.last_active && (
                            <span>Active {new Date(userProfile.last_active).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>

                {showFollowButton && (
                    <div className="flex gap-2">
                        {userProfile.username === user?.username ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                icon={UserPlus}
                                className="md:px-3 px-2"
                            >
                                <span className="hidden md:inline">You</span>
                            </Button>
                        ) : isFollowing(userProfile.username) ? (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUnfollow(userProfile.username)}
                                icon={UserMinus}
                                className="md:px-3 px-2"
                            >
                                <span className="hidden md:inline">Unfollow</span>
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleFollow(userProfile.username)}
                                icon={UserPlus}
                                className="md:px-3 px-2"
                            >
                                <span className="hidden md:inline">Follow</span>
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderLeaderboardItem = (entry: ReferralLeaderboardEntry, index: number) => (
        <motion.div
            key={entry.username}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-surface-700 rounded-xl border border-surface-600 p-4 hover:bg-surface-600/30 transition-colors"
        >
            <div className="flex items-center gap-4">
                <div className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center text-black font-bold',
                    index === 0 && 'bg-warning',
                    index === 1 && 'bg-muted',
                    index === 2 && 'bg-orange-600 text-white',
                    index > 2 && 'bg-accent'
                )}>
                    {index === 0 && <Crown className="w-5 h-5" />}
                    {index > 0 && `#${index + 1}`}
                </div>

                <div className="flex-1">
                    <h3 className="font-semibold text-text-default">@{entry.username}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted">
                        <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {entry.referral_count} referrals
                        </span>
                        <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            ${entry.total_rewards?.toFixed(2) || '0.00'} earned
                        </span>
                    </div>
                </div>

                <div className="text-right">
                    <div className="text-lg font-bold text-success">
                        {entry.referral_count}
                    </div>
                    <div className="text-xs text-muted">referrals</div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="w-full max-w-none space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-text-default mb-2">Social Network</h1>
                <p className="text-muted">
                    Connect with other traders, discover new strategies, and build your network.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-surface-700 border border-surface-600 rounded-xl text-text-default placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-surface-800 rounded-xl p-1">
                {[
                    { id: 'discover', label: 'Discover', icon: Search },
                    { id: 'followers', label: `Followers (${followers.length})`, icon: Users },
                    { id: 'following', label: `Following (${following.length})`, icon: UserPlus },
                    { id: 'leaderboard', label: 'Top Referrers', icon: Award }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            activeTab === tab.id
                                ? 'bg-primary text-black shadow-glow'
                                : 'text-muted hover:text-text-default'
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <CardLoading text="Loading social data..." />
            ) : (
                <div className="space-y-4">
                    {activeTab === 'discover' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-text-default">Discover Users</h2>
                                <span className="text-sm text-muted">{filteredUsers.length} users found</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredUsers.length > 0 ? (
                                    <>
                                        {filteredUsers.map(userProfile => renderUserCard(userProfile))}
                                        {!searchTerm && (
                                            <div className="col-span-full text-center pt-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        // TODO: Load more users from leaderboard
                                                        console.log('Load more users clicked');
                                                    }}
                                                    className="md:px-4 px-3"
                                                >
                                                    <span className="hidden md:inline">Load More Users</span>
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                ) : searchTerm ? (
                                    <div className="col-span-full text-center py-12 text-muted">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No users found matching "{searchTerm}". Try adjusting your search.</p>
                                    </div>
                                ) : (
                                    <div className="col-span-full text-center py-12 text-muted">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No users available to discover yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'followers' && (
                        <div>
                            <h2 className="text-lg font-semibold text-text-default mb-4">Your Followers</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {followers.length > 0 ? (
                                    followers.map(userProfile => renderUserCard(userProfile, false))
                                ) : (
                                    <div className="col-span-full text-center py-12 text-muted">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No followers yet. Start sharing your trading insights!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'following' && (
                        <div>
                            <h2 className="text-lg font-semibold text-text-default mb-4">People You Follow</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {following.length > 0 ? (
                                    following.map(userProfile => renderUserCard(userProfile))
                                ) : (
                                    <div className="col-span-full text-center py-12 text-muted">
                                        <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>You're not following anyone yet. Discover amazing traders!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'leaderboard' && (
                        <div>
                            <h2 className="text-lg font-semibold text-text-default mb-4">Top Referrers</h2>
                            <div className="space-y-3">
                                {leaderboard.length > 0 ? (
                                    leaderboard.map((entry, index) => renderLeaderboardItem(entry, index))
                                ) : (
                                    <div className="text-center py-12 text-muted">
                                        <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No referral data available yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-surface-700 rounded-xl p-4 border border-surface-600">
                <h3 className="font-semibold text-text-default mb-3">Quick Actions</h3>
                <div className="flex gap-3">
                    <Button variant="primary" icon={Share2} className="md:px-4 px-3">
                        <span className="hidden md:inline">Share Your Profile</span>
                    </Button>
                    <Button variant="secondary" icon={Users} className="md:px-4 px-3">
                        <span className="hidden md:inline">Invite Friends</span>
                    </Button>
                    <Button variant="ghost" icon={Heart} className="md:px-4 px-3">
                        <span className="hidden md:inline">View Activity</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};
