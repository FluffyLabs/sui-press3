#[test_only]
module press3::press3_test {
    use press3::press3::{Self, Press3, E_CANNOT_REMOVE_SELF, E_ADMIN_NOT_FOUND, E_EDITOR_NOT_FOUND};
    use std::string;
    use sui::test_scenario;

    const ADMIN: address = @0xAD;
    const NEW_ADMIN: address = @0xAD2;
    const EDITOR: address = @0xED;
    const NEW_EDITOR: address = @0xED2;

    #[test]
    fun test_add_admin() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize the Press3 object
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Add a new admin
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let new_admin = NEW_ADMIN;
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::add_admin(&mut state, new_admin, test_scenario::ctx(&mut scenario));

            // Verify the new admin was added
            let admins = press3::admins(&state);
            assert!(admins.contains(&new_admin), 0);
            assert!(admins.length() == 2, 1);

            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_remove_admin() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize and add a second admin
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::add_admin(&mut state, NEW_ADMIN, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        // Remove the second admin
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let new_admin = NEW_ADMIN;
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::remove_admin(&mut state, new_admin, test_scenario::ctx(&mut scenario));

            // Verify the admin was removed
            let admins = press3::admins(&state);
            assert!(!admins.contains(&new_admin), 0);
            assert!(admins.length() == 1, 1);

            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_CANNOT_REMOVE_SELF)]
    fun test_admin_cannot_remove_self() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Try to remove self (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::remove_admin(&mut state, ADMIN, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_ADMIN_NOT_FOUND)]
    fun test_remove_nonexistent_admin() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Try to remove non-existent admin (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::remove_admin(&mut state, NEW_ADMIN, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_add_editor() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_top_level(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Add a new editor to the page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::add_editor(&mut state, 0, NEW_EDITOR, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_remove_editor() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_top_level(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Add a new editor
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::add_editor(&mut state, 0, NEW_EDITOR, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        // Remove the editor
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::remove_editor(&mut state, 0, NEW_EDITOR, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_CANNOT_REMOVE_SELF)]
    fun test_editor_cannot_remove_self() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page (ADMIN becomes an editor)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_top_level(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Try to remove self as editor (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::remove_editor(&mut state, 0, ADMIN, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = E_EDITOR_NOT_FOUND)]
    fun test_remove_nonexistent_editor() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_top_level(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(state);
        };

        // Try to remove non-existent editor (should fail)
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::remove_editor(&mut state, 0, NEW_EDITOR, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }

    #[test]
    fun test_editor_can_add_another_editor() {
        let mut scenario = test_scenario::begin(ADMIN);

        // Initialize
        {
            press3::init_for_testing(test_scenario::ctx(&mut scenario));
        };

        // Register a page with EDITOR as the initial editor
        test_scenario::next_tx(&mut scenario, ADMIN);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::register_top_level(
                &mut state,
                string::utf8(b"/test"),
                string::utf8(b"blob123"),
                test_scenario::ctx(&mut scenario)
            );

            // Add EDITOR to the page
            press3::add_editor(&mut state, 0, EDITOR, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        // EDITOR adds NEW_EDITOR
        test_scenario::next_tx(&mut scenario, EDITOR);
        {
            let mut state = test_scenario::take_shared<Press3>(&scenario);
            press3::add_editor(&mut state, 0, NEW_EDITOR, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(state);
        };

        test_scenario::end(scenario);
    }
}
