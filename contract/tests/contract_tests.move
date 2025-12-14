#[test_only]
module contract::press3_test {
    use contract::press3::{Self, Press3, E_NOT_ADMIN, E_NOT_EDITOR, E_INVALID_PAGE_PATH, E_EMPTY_ADMINS, E_PATH_ALREADY_EXISTS, E_INVALID_PATH_FORMAT};
    use std::string;
    use sui::test_scenario;

    const ADMIN: address = @0xAD;
    const NEW_ADMIN: address = @0xAD2;
    const ANOTHER_ADMIN: address = @0xAD3;
    const EDITOR: address = @0xED;
    const NEW_EDITOR: address = @0xED2;
    const NON_ADMIN: address = @0xBAD;

    #[test]
    fun test_register_page() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a top-level page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/about"),
                string::utf8(b"walrus_blob_123"),
                test_scenario::ctx(&mut scenario)
            );

            assert!(press3::pages_count(&state) == 1, 0);

            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_non_admin_cannot_register_page() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Non-admin tries to register a page (should fail)
        test_scenario::next_tx(&mut scenario, NON_ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_PATH_ALREADY_EXISTS)]
    fun test_cannot_register_duplicate_path() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/about"),
                string::utf8(b"walrus_blob_123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Try to register the same path again (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/about"),
                string::utf8(b"different_blob"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_register_multiple_pages() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register first page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/home"),
                string::utf8(b"homepage_blob"),
                test_scenario::ctx(&mut scenario)
            );

            // Verify first page was added
            assert!(press3::pages_count(&state) == 1, 0);

            test_scenario::return_shared(state);
        };

        // Register second page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/blog"),
                string::utf8(b"blog_blob"),
                test_scenario::ctx(&mut scenario)
            );

            // Verify second page was added
            assert!(press3::pages_count(&state) == 2, 1);

            test_scenario::return_shared(state);
        };

        // Register third page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/contact"),
                string::utf8(b"contact_blob"),
                test_scenario::ctx(&mut scenario)
            );

            // Verify all three pages were added
            assert!(press3::pages_count(&state) == 3, 2);

            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_update_page_changes_walrus_id() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page with initial walrus_id
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/docs"),
                string::utf8(b"original_blob_id"),
                test_scenario::ctx(&mut scenario)
            );

            // Verify page was added
            assert!(press3::pages_count(&state) == 1, 0);

            test_scenario::return_shared(state);
        };

        // Update the page with new walrus_id
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::update_page_walrus_id(
                &mut state,
                0,
                string::utf8(b"/docs"),
                string::utf8(b"updated_blob_id"),
                test_scenario::ctx(&mut scenario)
            );

            // Verify length unchanged after update
            assert!(press3::pages_count(&state) == 1, 1);

            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_INVALID_PAGE_PATH)]
    fun test_update_page_wrong_path_fails() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/about"),
                string::utf8(b"about_blob"),
                test_scenario::ctx(&mut scenario)
            );

            // Verify page was added
            assert!(press3::pages_count(&state) == 1, 0);

            test_scenario::return_shared(state);
        };

        // Try to update with wrong path (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::update_page_walrus_id(
                &mut state,
                0,
                string::utf8(b"/wrong_path"),
                string::utf8(b"new_blob"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_set_admins() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize the Press3 object
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Set new admins list
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let admin = ADMIN;
            let new_admin = NEW_ADMIN;
            let another_admin = ANOTHER_ADMIN;
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            let new_admins = vector[admin, new_admin, another_admin];
            press3::set_admins(&mut state, new_admins, test_scenario::ctx(&mut scenario));

            // Verify the admins were set
            let admins = press3::admins(&state);
            assert!(admins.length() == 3, 0);
            assert!(admins.contains(&admin), 1);
            assert!(admins.contains(&new_admin), 2);
            assert!(admins.contains(&another_admin), 3);

            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_non_admin_cannot_set_admins() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Non-admin tries to set admins (should fail)
        test_scenario::next_tx(&mut scenario, NON_ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            let new_admins = vector[NON_ADMIN];
            press3::set_admins(&mut state, new_admins, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_EMPTY_ADMINS)]
    fun test_cannot_set_empty_admins() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Admin tries to set empty admins list (should fail to prevent lock-out)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            let empty_admins = vector::empty<address>();
            press3::set_admins(&mut state, empty_admins, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_set_editors() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Set editors for the page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let editor = EDITOR;
            let new_editor = NEW_EDITOR;
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            let new_editors = vector[editor, new_editor];
            press3::set_editors(
                &mut state,
                0,
                string::utf8(b"/test"),
                new_editors,
                test_scenario::ctx(&mut scenario)
            );

            // Verify editors were set
            let editors = press3::editors(&state, 0, string::utf8(b"/test"));
            assert!(editors.length() == 2, 0);
            assert!(editors.contains(&editor), 1);
            assert!(editors.contains(&new_editor), 2);

            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_NOT_ADMIN)]
    fun test_non_admin_cannot_set_editors() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Non-admin tries to set editors (should fail)
        test_scenario::next_tx(&mut scenario, NON_ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            let new_editors = vector[NON_ADMIN];
            press3::set_editors(
                &mut state,
                0,
                string::utf8(b"/test"),
                new_editors,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_INVALID_PAGE_PATH)]
    fun test_set_editor_wrong_path() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Try to set editors with wrong path (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            let new_editors = vector[EDITOR];
            press3::set_editors(
                &mut state,
                0,
                string::utf8(b"/wrong"),
                new_editors,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_admin_can_update_walrus_id() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Admin updates the walrus_id
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::update_page_walrus_id(
                &mut state,
                0,
                string::utf8(b"/test"),
                string::utf8(b"new_blob456"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_editor_can_update_walrus_id() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Set EDITOR as an editor
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            let new_editors = vector[ADMIN, EDITOR];
            press3::set_editors(
                &mut state,
                0,
                string::utf8(b"/test"),
                new_editors,
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Editor updates the walrus_id
        test_scenario::next_tx(&mut scenario, EDITOR);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::update_page_walrus_id(
                &mut state,
                0,
                string::utf8(b"/test"),
                string::utf8(b"new_blob789"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_NOT_EDITOR)]
    fun test_non_editor_cannot_update_walrus_id() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Non-editor tries to update the walrus_id (should fail)
        test_scenario::next_tx(&mut scenario, NON_ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::update_page_walrus_id(
                &mut state,
                0,
                string::utf8(b"/test"),
                string::utf8(b"should_fail"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_INVALID_PATH_FORMAT)]
    fun test_cannot_register_empty_path() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Try to register a page with empty path (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b""),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_INVALID_PATH_FORMAT)]
    fun test_cannot_register_path_without_leading_slash() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Try to register a page with path that doesn't start with '/' (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_page(
                &mut state,
                string::utf8(b"about"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }
}
