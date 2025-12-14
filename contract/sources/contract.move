module contract::press3 {
    use std::string::String;
    use sui::event;

    const E_NOT_ADMIN: u64 = 0;
    const E_NOT_EDITOR: u64 = 1;
    const E_INVALID_PAGE_PATH: u64 = 2;
    const E_EMPTY_ADMINS: u64 = 3;
    const E_PATH_ALREADY_EXISTS: u64 = 4;

    public struct Press3 has key {
        id: sui::object::UID,
        admins: vector<address>,
        pages: vector<PageRecord>,
    }

    public struct PageRecord has copy, store {
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

    entry fun register_page(
        state: &mut Press3,
        path: String,
        walrus_id: String,
        ctx: &sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        assert!(!path_exists(state, &path), E_PATH_ALREADY_EXISTS);

        let editors = vector::empty<address>();
        vector::push_back(
            &mut state.pages,
            PageRecord {
                path,
                walrus_id,
                editors,
            },
        );

        event::emit(PageRegisteredEvent {
            path,
            walrus_id,
            editors,
        });
    }

    /// Returns the configured admins for off-chain tooling.
    entry fun admins(state: &Press3): vector<address> {
        state.admins
    }

    /// Returns the number of registered pages.
    entry fun pages_count(state: &Press3): u64 {
        state.pages.length()
    }

    /// Returns all pages registered in the contract.
    public fun pages(state: &Press3): vector<PageRecord> {
        state.pages
    }

    /// Returns the configured editors for off-chain tooling. Sanity checks if we query the right page.
    entry fun editors(state: &Press3, page_index: u64, page_path: String): vector<address> {
        let page = vector::borrow(&state.pages, page_index);
        assert!(page.path == page_path, E_INVALID_PAGE_PATH);
        page.editors
    }

    fun assert_admin(state: &Press3, ctx: &sui::tx_context::TxContext) {
        assert!(state.admins.contains(&sui::tx_context::sender(ctx)), E_NOT_ADMIN);
    }

    fun path_exists(state: &Press3, path: &String): bool {
        let mut i = 0;
        let len = state.pages.length();
        while (i < len) {
            if (&vector::borrow(&state.pages, i).path == path) {
                return true
            };
            i = i + 1;
        };
        false
    }

    /// Sets admins. Only existing admins can set admins.
    /// At least one admin must remain to prevent lock-out.
    entry fun set_admins(
        state: &mut Press3,
        new_admins: vector<address>,
        ctx: &sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        assert!(new_admins.length() > 0, E_EMPTY_ADMINS);
        state.admins = new_admins;
    }

    /// Set editors to a specific page. Only admins can set editors.
    entry fun set_editors(
        state: &mut Press3,
        page_index: u64,
        page_path: String,
        new_editors: vector<address>,
        ctx: &sui::tx_context::TxContext,
    ) {
        assert_admin(state, ctx);
        let page = vector::borrow_mut(&mut state.pages, page_index);
        assert!(page.path == page_path, E_INVALID_PAGE_PATH);
        page.editors = new_editors;
    }

    /// Updates the walrus_id for a specific page. Only admins and editors can update.
    entry fun update_page_walrus_id(
        state: &mut Press3,
        page_index: u64,
        page_path: String,
        new_walrus_id: String,
        ctx: &sui::tx_context::TxContext,
    ) {
        let page = vector::borrow_mut(&mut state.pages, page_index);
        assert!(page.path == page_path, E_INVALID_PAGE_PATH);

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
}
