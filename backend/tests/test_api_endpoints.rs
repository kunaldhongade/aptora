use actix_web::{test, web, App};
use serde_json::json;

use aptora_backend::{
    auth::AuthService,
    social::SocialService,
    models::NewUser,
    DbPool,
};

// Test the complete API flow
#[actix_web::test]
async fn test_auth_api_endpoints() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/api")
                .service(web::scope("/auth")
                    .service(aptora_backend::handlers::auth::register)
                    .service(aptora_backend::handlers::auth::login)
                    .service(aptora_backend::handlers::auth::check_username)
                )
            )
    ).await;

    // Test username availability check
    let req = test::TestRequest::get()
        .uri("/api/auth/check-username?username=testuser")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    // Test user registration
    let user_data = json!({
        "email": "apitest@example.com",
        "password": "testpassword123",
        "username": "apitestuser",
        "referral_code": null,
        "bio": "API test user",
        "avatar_url": "https://example.com/avatar.jpg"
    });
    
    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .set_json(&user_data)
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    // Test user login
    let login_data = json!({
        "email": "apitest@example.com",
        "password": "testpassword123"
    });
    
    let req = test::TestRequest::post()
        .uri("/api/auth/login")
        .set_json(&login_data)
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    // Parse response to get tokens
    let body = test::read_body(resp).await;
    let response: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert!(response["success"].as_bool().unwrap());
    assert!(response["data"]["access_token"].as_str().is_some());
    assert!(response["data"]["refresh_token"].as_str().is_some());
}

#[actix_web::test]
async fn test_social_api_endpoints() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/api")
                .service(web::scope("/social")
                    .service(aptora_backend::handlers::social::follow_user)
                    .service(aptora_backend::handlers::social::unfollow_user)
                    .service(aptora_backend::handlers::social::get_followers)
                    .service(aptora_backend::handlers::social::get_following)
                    .service(aptora_backend::handlers::social::get_referral_leaderboard)
                )
            )
    ).await;

    // Test referral leaderboard endpoint
    let req = test::TestRequest::get()
        .uri("/api/social/referral-leaderboard?limit=10")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    // Test followers endpoint (will be empty initially)
    let req = test::TestRequest::get()
        .uri("/api/social/followers/test-user-id")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    // Test following endpoint (will be empty initially)
    let req = test::TestRequest::get()
        .uri("/api/social/following/test-user-id")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
}

#[actix_web::test]
async fn test_user_profile_api_endpoints() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/api")
                .service(web::scope("/users")
                    .service(aptora_backend::handlers::users::get_user_profile)
                )
            )
    ).await;

    // Test get user profile endpoint
    let req = test::TestRequest::get()
        .uri("/api/users/test-user-id")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    // This will likely return 404 for non-existent user, which is expected
    assert!(resp.status().is_client_error() || resp.status().is_success());
}

#[actix_web::test]
async fn test_error_handling() {
    let app = test::init_service(
        App::new()
            .service(web::scope("/api")
                .service(web::scope("/auth")
                    .service(aptora_backend::handlers::auth::register)
                )
            )
    ).await;

    // Test registration with invalid data
    let invalid_data = json!({
        "email": "invalid-email",
        "password": "short",
        "username": ""
    });
    
    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .set_json(&invalid_data)
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    // Should return validation error
    assert!(resp.status().is_client_error());
    
    // Test registration with duplicate email (if we had a test DB)
    let duplicate_data = json!({
        "email": "duplicate@example.com",
        "password": "validpassword123",
        "username": "duplicateuser",
        "referral_code": null,
        "bio": null,
        "avatar_url": null
    });
    
    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .set_json(&duplicate_data)
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    // First registration should succeed
    assert!(resp.status().is_success());
    
    // Second registration with same email should fail
    let req = test::TestRequest::post()
        .uri("/api/auth/register")
        .set_json(&duplicate_data)
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    // Should return duplicate error
    assert!(resp.status().is_client_error());
}
