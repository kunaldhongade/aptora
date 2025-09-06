import type { ReferralLeaderboardEntry, User, UserProfile } from "../api";
import { apiClient } from "../api";

// Social-specific API methods
export const socialApi = {
  getUserProfile: (username: string) => apiClient.getUserProfile(username),
  getCurrentUserProfile: () => apiClient.getCurrentUserProfile(),
  updateUserProfile: (profileData: Partial<User>) =>
    apiClient.updateUserProfile(profileData),
  followUser: (username: string) => apiClient.followUser(username),
  unfollowUser: (username: string) => apiClient.unfollowUser(username),
  getFollowers: (username: string) => apiClient.getFollowers(username),
  getFollowing: (username: string) => apiClient.getFollowing(username),
  getReferralLeaderboard: () => apiClient.getReferralLeaderboard(),
  getAllUsers: () => apiClient.getAllUsers(),
  getReferralInfo: () => apiClient.getReferralInfo(),
  getReferredUsers: () => apiClient.getReferredUsers(),
};

export type { ReferralLeaderboardEntry, User, UserProfile };
