/// Aptora (ATO) Token Contract - Production Ready
/// A comprehensive fungible asset token for testing and production use
/// Features: Minting, burning, access control, pausability, supply limits
/// 
/// Token Details:
/// - Name: Aptora
/// - Symbol: ATO
/// - Decimals: 8 (configurable)

module my_addr::aptora_token {
    use std::error;
    use std::signer;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata, FungibleAsset};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::event;
    use aptos_std::table::{Self, Table};

    // Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_NOT_MINTER: u64 = 2;
    const E_NOT_BURNER: u64 = 3;
    const E_PAUSED: u64 = 4;
    const E_MAX_SUPPLY_REACHED: u64 = 5;
    const E_INSUFFICIENT_BALANCE: u64 = 6;
    const E_TRANSFER_DISABLED: u64 = 7;
    const E_INVALID_AMOUNT: u64 = 8;
    const E_ALREADY_HAS_ROLE: u64 = 9;
    const E_DOES_NOT_HAVE_ROLE: u64 = 10;

    /// Token configuration and control structure
    struct TokenController has key {
        /// Reference to extend the token object
        extend_ref: ExtendRef,
        /// Reference for minting tokens
        mint_ref: MintRef,
        /// Reference for burning tokens
        burn_ref: BurnRef,
        /// Reference for controlling transfers
        transfer_ref: TransferRef,
        /// Current owner of the token
        owner: address,
        /// Maximum supply limit (0 means unlimited)
        max_supply: Option<u64>,
        /// Current total supply
        current_supply: u64,
        /// Whether the token is paused
        is_paused: bool,
        /// Whether transfers are enabled
        transfers_enabled: bool,
        /// Table of minters
        minters: Table<address, bool>,
        /// Table of burners  
        burners: Table<address, bool>,
    }

    /// Events
    #[event]
    struct TokenCreated has drop, store {
        token_address: address,
        name: String,
        symbol: String,
        decimals: u8,
        max_supply: Option<u64>,
        creator: address,
    }

    #[event]
    struct Mint has drop, store {
        recipient: address,
        amount: u64,
        new_supply: u64,
    }

    #[event]
    struct Burn has drop, store {
        account: address,
        amount: u64,
        new_supply: u64,
    }

    #[event]
    struct Transfer has drop, store {
        from: address,
        to: address,
        amount: u64,
    }

    #[event]
    struct RoleGranted has drop, store {
        account: address,
        role: String,
        granter: address,
    }

    #[event]
    struct RoleRevoked has drop, store {
        account: address,
        role: String,
        revoker: address,
    }

    #[event]
    struct PauseToggled has drop, store {
        is_paused: bool,
        admin: address,
    }

    #[event]
    struct TransferToggled has drop, store {
        transfers_enabled: bool,
        admin: address,
    }

    #[event]
    struct OwnershipTransferred has drop, store {
        previous_owner: address,
        new_owner: address,
    }

    /// Initialize the Aptora token (called once by deployer)
    fun init_module(creator: &signer) {
        let creator_addr = signer::address_of(creator);
        
        // Token configuration
        let name = string::utf8(b"Aptora");
        let symbol = string::utf8(b"ATO");
        let decimals = 8u8;
        let icon_uri = string::utf8(b"https://aptora.io/icon.png");
        let project_uri = string::utf8(b"https://aptora.io");
        let description = string::utf8(b"Aptora (ATO) - A comprehensive fungible asset token for testing and production");
        let max_supply = option::some(1000000000000000u64); // 10M ATO with 8 decimals
        let initial_supply = option::some(100000000000u64);  // 1K ATO initial supply
        
        // Create the token object
        let constructor_ref = object::create_named_object(creator, *string::bytes(&symbol));
        let object_signer = object::generate_signer(&constructor_ref);
        let token_address = object::address_from_constructor_ref(&constructor_ref);

        // Create the fungible asset
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            &constructor_ref,
            max_supply,
            name,
            symbol,
            decimals,
            icon_uri,
            project_uri,
        );

        // Generate references
        let mint_ref = fungible_asset::generate_mint_ref(&constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(&constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);

        // Initialize controller
        let controller = TokenController {
            extend_ref,
            mint_ref,
            burn_ref,
            transfer_ref,
            owner: creator_addr,
            max_supply,
            current_supply: 0,
            is_paused: false,
            transfers_enabled: true,
            minters: table::new(),
            burners: table::new(),
        };

        // Grant initial roles to creator
        table::add(&mut controller.minters, creator_addr, true);
        table::add(&mut controller.burners, creator_addr, true);

        move_to(&object_signer, controller);

        // Mint initial supply to creator
        if (option::is_some(&initial_supply)) {
            let amount = option::extract(&mut initial_supply);
            mint_internal(token_address, creator_addr, amount);
        };

        // Emit creation event
        event::emit(TokenCreated {
            token_address,
            name,
            symbol,
            decimals,
            max_supply,
            creator: creator_addr,
        });
    }

    /// Get the Aptora token address (deterministic based on symbol)
    #[view]
    public fun get_token_address(creator_address: address): address {
        let symbol = string::utf8(b"ATO");
        object::create_object_address(&creator_address, *string::bytes(&symbol))
    }

    /// Mint ATO tokens to a specific account
    public entry fun mint(
        minter: &signer,
        recipient: address,
        amount: u64,
    ) acquires TokenController {
        let minter_addr = signer::address_of(minter);
        let token_address = get_token_address(minter_addr);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        // Check permissions and constraints
        assert!(!controller.is_paused, error::permission_denied(E_PAUSED));
        assert!(table::contains(&controller.minters, minter_addr), error::permission_denied(E_NOT_MINTER));
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        // Check max supply
        if (option::is_some(&controller.max_supply)) {
            let max_supply = *option::borrow(&controller.max_supply);
            assert!(controller.current_supply + amount <= max_supply, error::out_of_range(E_MAX_SUPPLY_REACHED));
        };

        mint_internal(token_address, recipient, amount);
    }

    /// Internal minting function
    fun mint_internal(
        token_address: address,
        recipient: address,
        amount: u64,
    ) acquires TokenController {
        let controller = borrow_global_mut<TokenController>(token_address);
        let metadata = object::address_to_object<Metadata>(token_address);
        
        // Mint the tokens
        let fa = fungible_asset::mint(&controller.mint_ref, amount);
        primary_fungible_store::deposit(recipient, fa);
        
        // Update supply
        controller.current_supply = controller.current_supply + amount;

        // Emit mint event
        event::emit(Mint {
            recipient,
            amount,
            new_supply: controller.current_supply,
        });
    }

    /// Burn ATO tokens from an account
    public entry fun burn(
        burner: &signer,
        account: address,
        amount: u64,
    ) acquires TokenController {
        let burner_addr = signer::address_of(burner);
        let token_address = get_token_address(burner_addr);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        // Check permissions
        assert!(!controller.is_paused, error::permission_denied(E_PAUSED));
        assert!(
            burner_addr == account || table::contains(&controller.burners, burner_addr), 
            error::permission_denied(E_NOT_BURNER)
        );
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));

        // Check balance
        let metadata = object::address_to_object<Metadata>(token_address);
        let current_balance = primary_fungible_store::balance(account, metadata);
        assert!(current_balance >= amount, error::invalid_argument(E_INSUFFICIENT_BALANCE));

        // Burn the tokens
        let fa_to_burn = primary_fungible_store::withdraw(burner, metadata, amount);
        fungible_asset::burn(&controller.burn_ref, fa_to_burn);
        
        // Update supply
        controller.current_supply = controller.current_supply - amount;

        // Emit burn event
        event::emit(Burn {
            account,
            amount,
            new_supply: controller.current_supply,
        });
    }

    /// Transfer tokens between accounts (with additional controls)
    public entry fun transfer(
        sender: &signer,
        token_address: address,
        recipient: address,
        amount: u64,
    ) acquires TokenController {
        let sender_addr = signer::address_of(sender);
        let controller = borrow_global<TokenController>(token_address);
        
        // Check if transfers are enabled and not paused
        assert!(!controller.is_paused, error::permission_denied(E_PAUSED));
        assert!(controller.transfers_enabled, error::permission_denied(E_TRANSFER_DISABLED));
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));

        let metadata = object::address_to_object<Metadata>(token_address);
        primary_fungible_store::transfer(sender, metadata, recipient, amount);

        // Emit transfer event
        event::emit(Transfer {
            from: sender_addr,
            to: recipient,
            amount,
        });
    }

    /// Grant minter role
    public entry fun grant_minter_role(
        owner: &signer,
        token_address: address,
        account: address,
    ) acquires TokenController {
        let owner_addr = signer::address_of(owner);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        assert!(owner_addr == controller.owner, error::permission_denied(E_NOT_OWNER));
        assert!(!table::contains(&controller.minters, account), error::already_exists(E_ALREADY_HAS_ROLE));
        
        table::add(&mut controller.minters, account, true);

        event::emit(RoleGranted {
            account,
            role: string::utf8(b"MINTER"),
            granter: owner_addr,
        });
    }

    /// Revoke minter role
    public entry fun revoke_minter_role(
        owner: &signer,
        token_address: address,
        account: address,
    ) acquires TokenController {
        let owner_addr = signer::address_of(owner);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        assert!(owner_addr == controller.owner, error::permission_denied(E_NOT_OWNER));
        assert!(table::contains(&controller.minters, account), error::not_found(E_DOES_NOT_HAVE_ROLE));
        
        table::remove(&mut controller.minters, account);

        event::emit(RoleRevoked {
            account,
            role: string::utf8(b"MINTER"),
            revoker: owner_addr,
        });
    }

    /// Grant burner role
    public entry fun grant_burner_role(
        owner: &signer,
        token_address: address,
        account: address,
    ) acquires TokenController {
        let owner_addr = signer::address_of(owner);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        assert!(owner_addr == controller.owner, error::permission_denied(E_NOT_OWNER));
        assert!(!table::contains(&controller.burners, account), error::already_exists(E_ALREADY_HAS_ROLE));
        
        table::add(&mut controller.burners, account, true);

        event::emit(RoleGranted {
            account,
            role: string::utf8(b"BURNER"),
            granter: owner_addr,
        });
    }

    /// Revoke burner role
    public entry fun revoke_burner_role(
        owner: &signer,
        token_address: address,
        account: address,
    ) acquires TokenController {
        let owner_addr = signer::address_of(owner);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        assert!(owner_addr == controller.owner, error::permission_denied(E_NOT_OWNER));
        assert!(table::contains(&controller.burners, account), error::not_found(E_DOES_NOT_HAVE_ROLE));
        
        table::remove(&mut controller.burners, account);

        event::emit(RoleRevoked {
            account,
            role: string::utf8(b"BURNER"),
            revoker: owner_addr,
        });
    }

    /// Pause/unpause token operations
    public entry fun set_pause(
        owner: &signer,
        token_address: address,
        paused: bool,
    ) acquires TokenController {
        let owner_addr = signer::address_of(owner);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        assert!(owner_addr == controller.owner, error::permission_denied(E_NOT_OWNER));
        
        controller.is_paused = paused;

        event::emit(PauseToggled {
            is_paused: paused,
            admin: owner_addr,
        });
    }

    /// Enable/disable transfers
    public entry fun set_transfers_enabled(
        owner: &signer,
        token_address: address,
        enabled: bool,
    ) acquires TokenController {
        let owner_addr = signer::address_of(owner);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        assert!(owner_addr == controller.owner, error::permission_denied(E_NOT_OWNER));
        
        controller.transfers_enabled = enabled;

        event::emit(TransferToggled {
            transfers_enabled: enabled,
            admin: owner_addr,
        });
    }

    /// Transfer ownership
    public entry fun transfer_ownership(
        owner: &signer,
        token_address: address,
        new_owner: address,
    ) acquires TokenController {
        let owner_addr = signer::address_of(owner);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        assert!(owner_addr == controller.owner, error::permission_denied(E_NOT_OWNER));
        
        let previous_owner = controller.owner;
        controller.owner = new_owner;

        event::emit(OwnershipTransferred {
            previous_owner,
            new_owner,
        });
    }

    /// Emergency freeze (can only be called by owner)
    public entry fun emergency_freeze(
        owner: &signer,
        token_address: address,
    ) acquires TokenController {
        let owner_addr = signer::address_of(owner);
        let controller = borrow_global_mut<TokenController>(token_address);
        
        assert!(owner_addr == controller.owner, error::permission_denied(E_NOT_OWNER));
        
        controller.is_paused = true;
        controller.transfers_enabled = false;

        event::emit(PauseToggled {
            is_paused: true,
            admin: owner_addr,
        });

        event::emit(TransferToggled {
            transfers_enabled: false,
            admin: owner_addr,
        });
    }

    // ===== VIEW FUNCTIONS =====

    /// Get token balance for an account
    #[view]
    public fun balance(account: address, token_address: address): u64 {
        let metadata = object::address_to_object<Metadata>(token_address);
        primary_fungible_store::balance(account, metadata)
    }

    /// Get total supply
    #[view]
    public fun total_supply(token_address: address): u64 acquires TokenController {
        let controller = borrow_global<TokenController>(token_address);
        controller.current_supply
    }

    /// Get max supply
    #[view]
    public fun max_supply(token_address: address): Option<u64> acquires TokenController {
        let controller = borrow_global<TokenController>(token_address);
        controller.max_supply
    }

    /// Check if token is paused
    #[view]
    public fun is_paused(token_address: address): bool acquires TokenController {
        let controller = borrow_global<TokenController>(token_address);
        controller.is_paused
    }

    /// Check if transfers are enabled
    #[view]
    public fun transfers_enabled(token_address: address): bool acquires TokenController {
        let controller = borrow_global<TokenController>(token_address);
        controller.transfers_enabled
    }

    /// Get token owner
    #[view]
    public fun owner(token_address: address): address acquires TokenController {
        let controller = borrow_global<TokenController>(token_address);
        controller.owner
    }

    /// Check if account has minter role
    #[view]
    public fun is_minter(token_address: address, account: address): bool acquires TokenController {
        let controller = borrow_global<TokenController>(token_address);
        table::contains(&controller.minters, account)
    }

    /// Check if account has burner role
    #[view]
    public fun is_burner(token_address: address, account: address): bool acquires TokenController {
        let controller = borrow_global<TokenController>(token_address);
        table::contains(&controller.burners, account)
    }

    /// Get token metadata object
    #[view]
    public fun get_metadata(token_address: address): Object<Metadata> {
        object::address_to_object<Metadata>(token_address)
    }
}