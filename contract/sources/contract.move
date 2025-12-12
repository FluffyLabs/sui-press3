module contract::press3 {
    use std::string;
    use std::string::String;
    use sui::event;

    const E_NOT_ADMIN: u64 = 0;

    public struct Press3 has key {
        id: sui::object::UID,
        admin: address,
        pages: vector<PageRecord>,
    }

    public struct PageRecord has store {
        path: String,
        walrus_id: String,
        editor: address,
    }

    public struct Press3InitializedEvent has copy, drop {
        admin: address,
    }

    public struct PageRegisteredEvent has copy, drop {
        path: String,
        walrus_id: String,
        editor: address,
    }

    /// Initializes a shared Press3 object with the transaction sender as admin.
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let admin = sui::tx_context::sender(ctx);
        let state = Press3 {
            id: sui::object::new(ctx),
            admin,
            pages: vector::empty<PageRecord>(),
        };
        event::emit(Press3InitializedEvent { admin });
        sui::transfer::share_object(state);
    }

    /// Registers a top-level page path and associated Walrus blob identifier.
    /// For now this function simply stores records in a vector; follow-up work
    /// will replace this with real permission checks and data structures.
    public fun register_top_level(
        state: &mut Press3,
        path: String,
        walrus_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        assert!(is_top_level(&path), E_NOT_ADMIN);

        let editor = sui::tx_context::sender(ctx);
        let path_for_event = path;
        let walrus_for_event = walrus_id;

        vector::push_back(
            &mut state.pages,
            PageRecord {
                path,
                walrus_id,
                editor,
            },
        );

        event::emit(PageRegisteredEvent {
            path: path_for_event,
            walrus_id: walrus_for_event,
            editor,
        });
    }

    /// Returns the configured admin for off-chain tooling.
    public fun admin(state: &Press3): address {
        state.admin
    }

    fun assert_admin(state: &Press3, ctx: &sui::tx_context::TxContext) {
        assert!(sui::tx_context::sender(ctx) == state.admin, E_NOT_ADMIN);
    }

    /// A naive helper that ensures the provided path represents `/foo` style
    /// top-level routes. This helps the MVP enforce admin-only registration.
    fun is_top_level(path: &String): bool {
        let bytes = string::as_bytes(path);
        let len = vector::length(bytes);
        if (len < 2) {
            return false
        };

        if (*vector::borrow(bytes, 0) != 47) {
            return false
        };

        let mut i = 1;
        while (i < len) {
            if (*vector::borrow(bytes, i) == 47) {
                return false
            };
            i = i + 1;
        };

        true
    }
}
