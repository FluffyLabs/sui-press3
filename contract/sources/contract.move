module contract::press3 {
    use std::string;
    use std::string::String;
    use sui::event;

    const E_NOT_ADMIN: u64 = 0;
    const E_NOT_EDITOR: u64 = 1;
    const E_INVALID_PAGE_PATH: u64 = 2;

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

    public struct PageUpdatedEvent has copy, drop {
        path: String,
        old_walrus_id: String,
        new_walrus_id: String,
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

    /// Returns the configured editors for off-chain tooling. Sanity checks if we query the right page.
    public fun editors(state: &Press3, page_index: u64, page_path: String): vector<address> {
        let page = vector::borrow(&state.pages, page_index);
        assert!(page.path == page_path, E_INVALID_PAGE_PATH);
        page.editors
    }

    fun assert_admin(state: &Press3, ctx: &sui::tx_context::TxContext) {
        assert!(state.admins.contains(&sui::tx_context::sender(ctx)), E_NOT_ADMIN);
    }

    /// Sets admins. Only existing admins can set admins.
    public fun set_admin(
        state: &mut Press3,
        new_admins: vector<address>,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        state.admins = new_admins;
    }

    /// Set editors to a specific page. Only admins can set editors.
    public fun set_editor(
        state: &mut Press3,
        page_index: u64,
        page_path: String,
        new_editors: vector<address>,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        let page = vector::borrow_mut(&mut state.pages, page_index);
        assert!(page.path == page_path, E_INVALID_PAGE_PATH);
        page.editors = new_editors;
    }

    /// Updates the walrus_id for a specific page. Only admins and editors can update.
    public fun update_page_walrus_id(
        state: &mut Press3,
        page_index: u64,
        new_walrus_id: String,
        ctx: &mut sui::tx_context::TxContext,
    ) {
        let page = vector::borrow_mut(&mut state.pages, page_index);

        let sender = sui::tx_context::sender(ctx);
        let is_admin = state.admins.contains(&sender);
        let is_editor = page.editors.contains(&sender);
        assert!(is_admin || is_editor, E_NOT_EDITOR);

        let old_walrus_id = page.walrus_id;
        page.walrus_id = new_walrus_id;

        event::emit(PageUpdatedEvent {
            path: page.path,
            old_walrus_id,
            new_walrus_id,
        });
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
