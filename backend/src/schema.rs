// @generated automatically by Diesel CLI.

diesel::table! {
    follows (id) {
        id -> Uuid,
        follower_id -> Uuid,
        following_id -> Uuid,
        created_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    referral_rewards (id) {
        id -> Uuid,
        referrer_id -> Uuid,
        referred_user_id -> Uuid,
        reward_amount -> Float8,
        #[max_length = 50]
        reward_type -> Varchar,
        #[max_length = 20]
        status -> Nullable<Varchar>,
        created_at -> Nullable<Timestamptz>,
        paid_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    sessions (id) {
        id -> Uuid,
        user_id -> Nullable<Uuid>,
        refresh_token_hash -> Text,
        created_at -> Nullable<Timestamptz>,
        expires_at -> Timestamptz,
    }
}

diesel::table! {
    users (id) {
        id -> Uuid,
        email -> Text,
        password_hash -> Text,
        username -> Text,
        created_at -> Nullable<Timestamptz>,
        updated_at -> Nullable<Timestamptz>,
        referred_by -> Nullable<Uuid>,
        referral_count -> Nullable<Int4>,
        total_referral_rewards -> Nullable<Float8>,
        bio -> Nullable<Text>,
        avatar_url -> Nullable<Text>,
        is_verified -> Nullable<Bool>,
        last_active -> Nullable<Timestamptz>,
    }
}

diesel::joinable!(sessions -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    follows,
    referral_rewards,
    sessions,
    users,
);
