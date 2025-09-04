use actix_web::{test, web, App};
use diesel::r2d2::{ConnectionManager, Pool};
use diesel::PgConnection;
use serde_json::json;

use aptora_backend::{
    auth::AuthService,
    social::SocialService,
    models::{NewUser, UserProfile, NewFollow},
    schema,
    DbPool,
    utils::AppError,
};

// Test database setup
async fn setup_test_db() -> DbPool {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://postgres:password@localhost:5432/aptora_test".to_string());
    
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    Pool::builder()
        .build(manager)
        .expect("Failed to create pool")
}

// Helper function to create a test user
async fn create_test_user(
    pool: &DbPool,
    email: &str,
    username: &str,
    referral_code: Option<&str>,
) -> Result<UserProfile, AppError> {
    let auth_service = AuthService::new(pool.clone());
    
    let new_user = NewUser {
        email: email.to_string(),
        password: "testpassword123".to_string(),
        username: username.to_string(),
        referral_code,
        bio: Some("Test user bio".to_string()),
        avatar_url: Some("https://example.com/avatar.jpg".to_string()),
    };
    
    auth_service.register(new_user).await
}

// Helper function to login a test user
async fn login_test_user(
    pool: &DbPool,
    email: &str,
    password: &str,
) -> Result<(String, String), AppError> {
    let auth_service = AuthService::new(pool.clone());
    
    let result = auth_service.login(email, password).await?;
    Ok((result.access_token, result.refresh_token))
}

#[actix_web::test]
async fn test_user_registration() {
    let pool = setup_test_db().await;
    
    // Test basic user registration
    let result = create_test_user(&pool, "test1@example.com", "testuser1", None).await;
    assert!(result.is_ok(), "User registration should succeed");
    
    let user = result.unwrap();
    assert_eq!(user.email, "test1@example.com");
    assert_eq!(user.username, "testuser1");
    assert_eq!(user.referral_count, Some(0));
    assert_eq!(user.is_verified, Some(false));
}

#[actix_web::test]
async fn test_user_registration_with_referral() {
    let pool = setup_test_db().await;
    
    // Create referrer user first
    let referrer = create_test_user(&pool, "referrer@example.com", "referrer", None).await.unwrap();
    
    // Test user registration with referral code
    let result = create_test_user(&pool, "referred@example.com", "referred", Some("referrer")).await;
    assert!(result.is_ok(), "User registration with referral should succeed");
    
    let user = result.unwrap();
    assert_eq!(user.email, "referred@example.com");
    assert_eq!(user.username, "referred");
    
    // Check that referrer's referral count increased
    let auth_service = AuthService::new(pool.clone());
    let updated_referrer = auth_service.get_user_profile(referrer.id).await.unwrap();
    assert_eq!(updated_referrer.referral_count, Some(1));
}

#[actix_web::test]
async fn test_user_login() {
    let pool = setup_test_db().await;
    
    // Create a test user
    let _user = create_test_user(&pool, "login@example.com", "loginuser", None).await.unwrap();
    
    // Test login
    let result = login_test_user(&pool, "login@example.com", "testpassword123").await;
    assert!(result.is_ok(), "User login should succeed");
    
    let (access_token, refresh_token) = result.unwrap();
    assert!(!access_token.is_empty());
    assert!(!refresh_token.is_empty());
}

#[actix_web::test]
async fn test_username_uniqueness() {
    let pool = setup_test_db().await;
    
    // Create first user
    let _user1 = create_test_user(&pool, "user1@example.com", "sameusername", None).await.unwrap();
    
    // Try to create second user with same username
    let result = create_test_user(&pool, "user2@example.com", "sameusername", None).await;
    assert!(result.is_err(), "Should not allow duplicate usernames");
}

#[actix_web::test]
async fn test_follow_system() {
    let pool = setup_test_db().await;
    
    // Create two test users
    let user1 = create_test_user(&pool, "follower@example.com", "follower", None).await.unwrap();
    let user2 = create_test_user(&pool, "followed@example.com", "followed", None).await.unwrap();
    
    let social_service = SocialService::new(pool.clone());
    
    // Test follow
    let follow_result = social_service.follow_user(user1.id, user2.id).await;
    assert!(follow_result.is_ok(), "Follow should succeed");
    
    // Test get followers
    let followers = social_service.get_followers(user2.id).await.unwrap();
    assert_eq!(followers.len(), 1);
    assert_eq!(followers[0].id, user1.id);
    
    // Test get following
    let following = social_service.get_following(user1.id).await.unwrap();
    assert_eq!(following.len(), 1);
    assert_eq!(following[0].id, user2.id);
    
    // Test unfollow
    let unfollow_result = social_service.unfollow_user(user1.id, user2.id).await;
    assert!(unfollow_result.is_ok(), "Unfollow should succeed");
    
    // Verify unfollow worked
    let followers_after = social_service.get_followers(user2.id).await.unwrap();
    assert_eq!(followers_after.len(), 0);
}

#[actix_web::test]
async fn test_user_profiles() {
    let pool = setup_test_db().await;
    
    // Create a test user with profile data
    let user = create_test_user(&pool, "profile@example.com", "profileuser", None).await.unwrap();
    
    let auth_service = AuthService::new(pool.clone());
    
    // Test get user profile
    let profile = auth_service.get_user_profile(user.id).await.unwrap();
    assert_eq!(profile.email, "profile@example.com");
    assert_eq!(profile.username, "profileuser");
    assert_eq!(profile.bio, Some("Test user bio".to_string()));
    assert_eq!(profile.avatar_url, Some("https://example.com/avatar.jpg".to_string()));
    assert_eq!(profile.is_verified, Some(false));
    assert_eq!(profile.referral_count, Some(0));
}

#[actix_web::test]
async fn test_referral_leaderboard() {
    let pool = setup_test_db().await;
    
    // Create multiple users with referrals
    let user1 = create_test_user(&pool, "leader1@example.com", "leader1", None).await.unwrap();
    let user2 = create_test_user(&pool, "leader2@example.com", "leader2", None).await.unwrap();
    
    // Create referred users
    let _referred1 = create_test_user(&pool, "ref1@example.com", "ref1", Some("leader1")).await.unwrap();
    let _referred2 = create_test_user(&pool, "ref2@example.com", "ref2", Some("leader1")).await.unwrap();
    let _referred3 = create_test_user(&pool, "ref3@example.com", "ref3", Some("leader2")).await.unwrap();
    
    let social_service = SocialService::new(pool.clone());
    
    // Test referral leaderboard
    let leaderboard = social_service.get_referral_leaderboard(10).await.unwrap();
    assert_eq!(leaderboard.len(), 2);
    
    // leader1 should have 2 referrals, leader2 should have 1
    assert_eq!(leaderboard[0].username, "leader1");
    assert_eq!(leaderboard[0].referral_count, 2);
    assert_eq!(leaderboard[1].username, "leader2");
    assert_eq!(leaderboard[1].referral_count, 1);
}

#[actix_web::test]
async fn test_invalid_referral_code() {
    let pool = setup_test_db().await;
    
    // Try to register with non-existent referral code
    let result = create_test_user(&pool, "invalid@example.com", "invaliduser", Some("nonexistent")).await;
    assert!(result.is_err(), "Should not allow registration with invalid referral code");
}

#[actix_web::test]
async fn test_self_follow_prevention() {
    let pool = setup_test_db().await;
    
    let user = create_test_user(&pool, "self@example.com", "selfuser", None).await.unwrap();
    let social_service = SocialService::new(pool.clone());
    
    // Try to follow self
    let result = social_service.follow_user(user.id, user.id).await;
    assert!(result.is_err(), "Should not allow self-follow");
}

#[actix_web::test]
async fn test_duplicate_follow_prevention() {
    let pool = setup_test_db().await;
    
    let user1 = create_test_user(&pool, "dup1@example.com", "dup1", None).await.unwrap();
    let user2 = create_test_user(&pool, "dup2@example.com", "dup2", None).await.unwrap();
    
    let social_service = SocialService::new(pool.clone());
    
    // Follow once
    let result1 = social_service.follow_user(user1.id, user2.id).await;
    assert!(result1.is_ok(), "First follow should succeed");
    
    // Try to follow again
    let result2 = social_service.follow_user(user1.id, user2.id).await;
    assert!(result2.is_err(), "Duplicate follow should fail");
}

// Integration test for the complete flow
#[actix_web::test]
async fn test_complete_social_flow() {
    let pool = setup_test_db().await;
    
    // 1. Create referrer
    let referrer = create_test_user(&pool, "main@example.com", "mainuser", None).await.unwrap();
    
    // 2. Create referred user
    let referred = create_test_user(&pool, "referred@example.com", "referreduser", Some("mainuser")).await.unwrap();
    
    // 3. Login both users
    let (referrer_token, _) = login_test_user(&pool, "main@example.com", "testpassword123").await.unwrap();
    let (referred_token, _) = login_test_user(&pool, "referred@example.com", "testpassword123").await.unwrap();
    
    // 4. Follow each other
    let social_service = SocialService::new(pool.clone());
    social_service.follow_user(referrer.id, referred.id).await.unwrap();
    social_service.follow_user(referred.id, referrer.id).await.unwrap();
    
    // 5. Verify social connections
    let referrer_following = social_service.get_following(referrer.id).await.unwrap();
    let referred_following = social_service.get_following(referred.id).await.unwrap();
    
    assert_eq!(referrer_following.len(), 1);
    assert_eq!(referred_following.len(), 1);
    assert_eq!(referrer_following[0].id, referred.id);
    assert_eq!(referred_following[0].id, referrer.id);
    
    // 6. Check referral counts
    let updated_referrer = social_service.get_user_profile(referrer.id).await.unwrap();
    assert_eq!(updated_referrer.referral_count, Some(1));
    
    // 7. Check leaderboard
    let leaderboard = social_service.get_referral_leaderboard(10).await.unwrap();
    assert_eq!(leaderboard[0].username, "mainuser");
    assert_eq!(leaderboard[0].referral_count, 1);
}
