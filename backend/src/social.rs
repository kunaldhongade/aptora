use crate::models::{
    User, Follow, NewFollow, ReferralReward, NewReferralReward, 
    PublicUserProfile, ReferralLeaderboardEntry, FollowStats
};
use crate::schema::{users, follows, referral_rewards};
use crate::DbPool;
use crate::utils::AppError;
use diesel::prelude::*;
use chrono::Utc;
use uuid::Uuid;
// use rust_decimal::Decimal;

pub struct SocialService;

impl SocialService {
    // Follow a user
    pub async fn follow_user(
        pool: &DbPool,
        follower_id: Uuid,
        username_to_follow: &str,
    ) -> Result<(), AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Find the user to follow by username
        let user_to_follow = users::table
            .filter(users::username.eq(username_to_follow))
            .first::<User>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;

        // Prevent self-following
        if follower_id == user_to_follow.id {
            return Err(AppError::BadRequest("Cannot follow yourself".to_string()));
        }

        // Check if already following
        let existing_follow = follows::table
            .filter(follows::follower_id.eq(follower_id))
            .filter(follows::following_id.eq(user_to_follow.id))
            .first::<Follow>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?;

        if existing_follow.is_some() {
            return Err(AppError::BadRequest("Already following this user".to_string()));
        }

        // Create follow relationship
        let new_follow = NewFollow {
            follower_id,
            following_id: user_to_follow.id,
        };

        diesel::insert_into(follows::table)
            .values(&new_follow)
            .execute(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to create follow: {}", e)))?;

        Ok(())
    }

    // Unfollow a user
    pub async fn unfollow_user(
        pool: &DbPool,
        follower_id: Uuid,
        username_to_unfollow: &str,
    ) -> Result<(), AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Find the user to unfollow by username
        let user_to_unfollow = users::table
            .filter(users::username.eq(username_to_unfollow))
            .first::<User>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;

        // Delete follow relationship
        let deleted_count = diesel::delete(follows::table)
            .filter(follows::follower_id.eq(follower_id))
            .filter(follows::following_id.eq(user_to_unfollow.id))
            .execute(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to delete follow: {}", e)))?;

        if deleted_count == 0 {
            return Err(AppError::BadRequest("Not following this user".to_string()));
        }

        Ok(())
    }

    // Get followers of a user
    pub async fn get_followers(
        pool: &DbPool,
        username: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<PublicUserProfile>, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Find the user by username
        let user = users::table
            .filter(users::username.eq(username))
            .first::<User>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;

        // Get followers
        let followers = follows::table
            .filter(follows::following_id.eq(user.id))
            .inner_join(users::table.on(follows::follower_id.eq(users::id)))
            .select((
                users::id,
                users::username,
                users::bio,
                users::avatar_url,
                users::is_verified,
                users::referral_count,
                users::created_at,
                users::last_active,
            ))
            .order(follows::created_at.desc())
            .limit(limit)
            .offset(offset)
            .load::<(Uuid, String, Option<String>, Option<String>, Option<bool>, Option<i32>, Option<chrono::DateTime<Utc>>, Option<chrono::DateTime<Utc>>)>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to get followers: {}", e)))?;

        let profiles = followers.into_iter()
            .map(|(id, username, bio, avatar_url, is_verified, referral_count, created_at, last_active)| {
                PublicUserProfile {
                    id,
                    username,
                    bio,
                    avatar_url,
                    is_verified: is_verified,
                    referral_count: referral_count,
                    created_at: created_at,
                    last_active: last_active,
                }
            })
            .collect();

        Ok(profiles)
    }

    // Get users that a user is following
    pub async fn get_following(
        pool: &DbPool,
        username: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<PublicUserProfile>, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Find the user by username
        let user = users::table
            .filter(users::username.eq(username))
            .first::<User>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;

        // Get following
        let following = follows::table
            .filter(follows::follower_id.eq(user.id))
            .inner_join(users::table.on(follows::following_id.eq(users::id)))
            .select((
                users::id,
                users::username,
                users::bio,
                users::avatar_url,
                users::is_verified,
                users::referral_count,
                users::created_at,
                users::last_active,
            ))
            .order(follows::created_at.desc())
            .limit(limit)
            .offset(offset)
            .load::<(Uuid, String, Option<String>, Option<String>, Option<bool>, Option<i32>, Option<chrono::DateTime<Utc>>, Option<chrono::DateTime<Utc>>)>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to get following: {}", e)))?;

        let profiles = following.into_iter()
            .map(|(id, username, bio, avatar_url, is_verified, referral_count, created_at, last_active)| {
                PublicUserProfile {
                    id,
                    username,
                    bio,
                    avatar_url,
                    is_verified: is_verified,
                    referral_count: referral_count,
                    created_at: created_at,
                    last_active: last_active,
                }
            })
            .collect();

        Ok(profiles)
    }

    // Get follow statistics for a user
    pub async fn get_follow_stats(
        pool: &DbPool,
        username: &str,
    ) -> Result<FollowStats, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Find the user by username
        let user = users::table
            .filter(users::username.eq(username))
            .first::<User>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;

        // Count followers
        let followers_count = follows::table
            .filter(follows::following_id.eq(user.id))
            .count()
            .get_result::<i64>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to count followers: {}", e)))?;

        // Count following
        let following_count = follows::table
            .filter(follows::follower_id.eq(user.id))
            .count()
            .get_result::<i64>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to count following: {}", e)))?;

        Ok(FollowStats {
            followers_count,
            following_count,
        })
    }

    // Get public user profile by username
    pub async fn get_public_profile(
        pool: &DbPool,
        username: &str,
    ) -> Result<PublicUserProfile, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        let user = users::table
            .filter(users::username.eq(username))
            .first::<User>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;

        Ok(PublicUserProfile {
            id: user.id,
            username: user.username,
            bio: user.bio,
            avatar_url: user.avatar_url,
            is_verified: user.is_verified,
            referral_count: user.referral_count,
            created_at: user.created_at,
            last_active: user.last_active,
        })
    }

    // Get referral leaderboard
    pub async fn get_referral_leaderboard(
        pool: &DbPool,
        limit: i64,
    ) -> Result<Vec<ReferralLeaderboardEntry>, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        let leaderboard = users::table
            .filter(users::referral_count.gt(0))
            .select((
                users::username,
                users::referral_count,
                users::total_referral_rewards,
            ))
            .order(users::referral_count.desc())
            .limit(limit)
            .load::<(String, Option<i32>, Option<f64>)>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to get leaderboard: {}", e)))?;

        let entries = leaderboard.into_iter()
            .enumerate()
            .map(|(index, (username, referral_count, total_rewards))| {
                ReferralLeaderboardEntry {
                    username,
                    referral_count: referral_count.unwrap_or(0),
                    total_rewards,
                    rank: (index + 1) as i32,
                }
            })
            .collect();

        Ok(entries)
    }

    // Check if user is following another user
    pub async fn is_following(
        pool: &DbPool,
        follower_id: Uuid,
        username_to_check: &str,
    ) -> Result<bool, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        // Find the user to check by username
        let user_to_check = users::table
            .filter(users::username.eq(username_to_check))
            .first::<User>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?
            .ok_or_else(|| AppError::NotFoundError("User not found".to_string()))?;

        // Check if following
        let follow_exists = follows::table
            .filter(follows::follower_id.eq(follower_id))
            .filter(follows::following_id.eq(user_to_check.id))
            .first::<Follow>(conn)
            .optional()
            .map_err(|e| AppError::InternalServerError(format!("Database error: {}", e)))?;

        Ok(follow_exists.is_some())
    }

    // Update user profile
    pub async fn update_profile(
        pool: &DbPool,
        user_id: Uuid,
        bio: Option<String>,
        avatar_url: Option<String>,
    ) -> Result<(), AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        diesel::update(users::table)
            .filter(users::id.eq(user_id))
            .set((
                users::bio.eq(bio),
                users::avatar_url.eq(avatar_url),
                users::updated_at.eq(Utc::now()),
            ))
            .execute(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to update profile: {}", e)))?;

        Ok(())
    }

    // Get user's referral code (username)
    pub async fn get_referral_code(
        pool: &DbPool,
        user_id: Uuid,
    ) -> Result<String, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        let username = users::table
            .filter(users::id.eq(user_id))
            .select(users::username)
            .first::<String>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to get username: {}", e)))?;

        Ok(username)
    }

    // Get users that were referred by a specific user
    pub async fn get_referred_users(
        pool: &DbPool,
        referrer_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<PublicUserProfile>, AppError> {
        let conn = &mut pool.get()
            .map_err(|e| AppError::InternalServerError(format!("Failed to get connection: {}", e)))?;

        let referred_users = users::table
            .filter(users::referred_by.eq(referrer_id))
            .select((
                users::id,
                users::username,
                users::bio,
                users::avatar_url,
                users::is_verified,
                users::referral_count,
                users::created_at,
                users::last_active,
            ))
            .order(users::created_at.desc())
            .limit(limit)
            .offset(offset)
            .load::<(Uuid, String, Option<String>, Option<String>, Option<bool>, Option<i32>, Option<chrono::DateTime<Utc>>, Option<chrono::DateTime<Utc>>)>(conn)
            .map_err(|e| AppError::InternalServerError(format!("Failed to get referred users: {}", e)))?;

        let profiles = referred_users.into_iter()
            .map(|(id, username, bio, avatar_url, is_verified, referral_count, created_at, last_active)| {
                PublicUserProfile {
                    id,
                    username,
                    bio,
                    avatar_url,
                    is_verified: is_verified,
                    referral_count: referral_count,
                    created_at: created_at,
                    last_active: last_active,
                }
            })
            .collect();

        Ok(profiles)
    }
}
