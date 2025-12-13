module contract::press3 {
    use std::string;
    use std::string::String;
    use sui::event;

    const E_NOT_ADMIN: u64 = 0;
    const E_NOT_EDITOR: u64 = 1;
    const E_CANNOT_REMOVE_SELF: u64 = 2;
    const E_ADMIN_NOT_FOUND: u64 = 3;
    const E_EDITOR_NOT_FOUND: u64 = 4;

    public struct Press3 has key {
        id: sui::object::UID,
        admins: vector<address>,
        pages: vector<PageRecord>,
    }

    public struct PageRecord has store {
        path: String,
        walrus_id: String,
        editors: vector<address>,
    }

    public struct Press3InitializedEvent has copy, drop {
        admin: address,
    }

    public struct PageRegisteredEvent has copy, drop {
        path: String,
        walrus_id: String,
        editors: vector<address>,
    }

    /// Initializes a shared Press3 object with the transaction sender as admin.
    fun init(ctx: &mut sui::tx_context::TxContext) {
        let admin = sui::tx_context::sender(ctx);
        let mut admins = vector::empty<address>();
        admins.push_back(admin);
        let state = Press3 {
            id: sui::object::new(ctx),
            admins,
            pages: vector::empty<PageRecord>(),
        };
        event::emit(Press3InitializedEvent { admin });
        sui::transfer::share_object(state);
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut sui::tx_context::TxContext) {
        init(ctx);
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
        let mut editors = vector::empty<address>();
        editors.push_back(editor);

        let path_for_event = path;
        let walrus_for_event = walrus_id;
        let editors_for_event = editors;

        vector::push_back(
            &mut state.pages,
            PageRecord {
                path,
                walrus_id,
                editors,
            },
        );

        event::emit(PageRegisteredEvent {
            path: path_for_event,
            walrus_id: walrus_for_event,
            editors: editors_for_event,
        });
    }

    /// Returns the configured admins for off-chain tooling.
    public fun admins(state: &Press3): vector<address> {
        state.admins
    }

    fun assert_admin(state: &Press3, ctx: &sui::tx_context::TxContext) {
        assert!(state.admins.contains(&sui::tx_context::sender(ctx)), E_NOT_ADMIN);
    }

    /// Adds a new admin. Only existing admins can add new admins.
    public fun add_admin(
        state: &mut Press3,
        new_admin: address,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        if (!state.admins.contains(&new_admin)) {
            state.admins.push_back(new_admin);
        };
    }

    /// Removes an admin. Only existing admins can remove admins.
    /// Admins cannot remove themselves.
    public fun remove_admin(
        state: &mut Press3,
        admin_to_remove: address,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        let sender = sui::tx_context::sender(ctx);

        // Prevent self-removal
        assert!(sender != admin_to_remove, E_CANNOT_REMOVE_SELF);

        let (found, index) = state.admins.index_of(&admin_to_remove);
        assert!(found, E_ADMIN_NOT_FOUND);
        state.admins.remove(index);
    }

    /// Adds an editor to a specific page. Only admins or existing editors can add editors.
    public fun add_editor(
        state: &mut Press3,
        page_index: u64,
        new_editor: address,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        let page = vector::borrow_mut(&mut state.pages, page_index);

        // Add editor if not already in the list
        if (!page.editors.contains(&new_editor)) {
            page.editors.push_back(new_editor);
        };
    }

    /// Removes an editor from a specific page. Only admins or existing editors can remove editors.
    /// Editors cannot remove themselves.
    public fun remove_editor(
        state: &mut Press3,
        page_index: u64,
        editor_to_remove: address,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        let page = vector::borrow_mut(&mut state.pages, page_index);

        let (found, index) = page.editors.index_of(&editor_to_remove);
        assert!(found, E_EDITOR_NOT_FOUND);
        page.editors.remove(index);
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
