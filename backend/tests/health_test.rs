use actix_web::{test, App};
use aptora_backend::main as app_main;

#[actix_web::test]
async fn test_health_check() {
    let app = test::init_service(App::new().configure(app_main)).await;
    let req = test::TestRequest::get().uri("/api/health").to_request();
    let resp = test::call_service(&app, req).await;
    
    assert!(resp.status().is_success());
    
    let body = test::read_body(resp).await;
    let health_data: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert_eq!(health_data["status"], "ok");
    assert!(health_data["timestamp"].is_string());
    assert!(health_data["version"].is_string());
}
