// @generated automatically by Diesel CLI.

diesel::table! {
    balances (id) {
        id -> Uuid,
        user_id -> Uuid,
        asset -> Varchar,
        available -> Double,
        locked -> Double,
        total -> Double,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    markets (id) {
        id -> Uuid,
        symbol -> Varchar,
        base_asset -> Varchar,
        quote_asset -> Varchar,
        min_order_size -> Double,
        max_order_size -> Double,
        tick_size -> Double,
        is_active -> Bool,
        created_at -> Timestamptz,
    }
}

diesel::table! {
    orders (id) {
        id -> Uuid,
        user_id -> Uuid,
        market_id -> Uuid,
        order_type -> Varchar,
        side -> Varchar,
        quantity -> Double,
        price -> Nullable<Double>,
        status -> Varchar,
        filled_quantity -> Double,
        average_price -> Nullable<Double>,
        leverage -> Nullable<Double>,
        margin_type -> Nullable<Varchar>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    positions (id) {
        id -> Uuid,
        user_id -> Uuid,
        market_id -> Uuid,
        side -> Varchar,
        size -> Double,
        entry_price -> Double,
        mark_price -> Double,
        unrealized_pnl -> Double,
        realized_pnl -> Double,
        margin -> Double,
        leverage -> Double,
        liquidation_price -> Nullable<Double>,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    users (id) {
        id -> Uuid,
        email -> Varchar,
        username -> Varchar,
        password_hash -> Varchar,
        created_at -> Timestamptz,
        updated_at -> Timestamptz,
    }
}

diesel::table! {
    sessions (id) {
        id -> Uuid,
        user_id -> Uuid,
        refresh_token_hash -> Varchar,
        created_at -> Timestamptz,
        expires_at -> Timestamptz,
    }
}

diesel::joinable!(balances -> users (user_id));
diesel::joinable!(orders -> markets (market_id));
diesel::joinable!(orders -> users (user_id));
diesel::joinable!(positions -> markets (market_id));
diesel::joinable!(positions -> users (user_id));
diesel::joinable!(sessions -> users (user_id));

diesel::allow_tables_to_appear_in_same_query!(
    balances,
    markets,
    orders,
    positions,
    sessions,
    users,
);
