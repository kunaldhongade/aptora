use resend_rs::types::CreateEmailBaseOptions;
use resend_rs::{Resend, Result};
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone)]
pub struct EmailService {
    client: Resend,
    from_email: String,
    base_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PasswordResetEmail {
    pub to: String,
    pub username: String,
    pub reset_token: String,
    pub reset_url: String,
}

impl EmailService {
    pub fn new() -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let api_key = env::var("RESEND_API_KEY")
            .map_err(|_| "RESEND_API_KEY environment variable not set")?;

        let from_email =
            env::var("FROM_EMAIL").unwrap_or_else(|_| "noreply@aptora.com".to_string());

        let base_url = env::var("FRONTEND_URL")
            .unwrap_or_else(|_| "https://aptora-kana.netlify.app".to_string());

        let client = Resend::new(&api_key);

        Ok(EmailService {
            client,
            from_email,
            base_url,
        })
    }

    pub async fn send_password_reset_email(
        &self,
        email_data: PasswordResetEmail,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let reset_url = format!(
            "{}/reset-password?token={}",
            self.base_url, email_data.reset_token
        );

        let html_content = self.generate_password_reset_html(&email_data.username, &reset_url);
        let text_content = self.generate_password_reset_text(&email_data.username, &reset_url);

        let email = CreateEmailBaseOptions::new(
            self.from_email.clone(),
            &[email_data.to.clone()],
            "Reset Your Aptora Password",
        )
        .with_html(&html_content)
        .with_text(&text_content);

        self.client.emails.send(email).await?;

        log::info!("Password reset email sent to: {}", email_data.to);
        Ok(())
    }

    fn generate_password_reset_html(&self, username: &str, reset_url: &str) -> String {
        format!(
            r#"
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Aptora Password</title>
                <style>
                    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                    .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }}
                    .button {{ display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }}
                    .button:hover {{ background: #5a6fd8; }}
                    .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>🚀 Aptora</h1>
                    <p>Reset Your Password</p>
                </div>
                <div class="content">
                    <h2>Hi {}!</h2>
                    <p>We received a request to reset your password for your Aptora account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="{}" class="button">Reset Password</a>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace;">{}</p>
                    <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>© 2025 Aptora. All rights reserved.</p>
                    <p>This is an automated message, please do not reply.</p>
                </div>
            </body>
            </html>
            "#,
            username, reset_url, reset_url
        )
    }

    fn generate_password_reset_text(&self, username: &str, reset_url: &str) -> String {
        format!(
            r#"
Reset Your Aptora Password

Hi {}!

We received a request to reset your password for your Aptora account.

Click the link below to reset your password:
{}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email.

© 2025 Aptora. All rights reserved.
            "#,
            username, reset_url
        )
    }
}
