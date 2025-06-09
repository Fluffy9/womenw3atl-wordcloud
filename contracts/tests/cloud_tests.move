module wordcloud::cloud_test {
    use sui::test_scenario;
    use wordcloud::cloud::{Self, WordMap, AdminConfig, AdminCap};

    #[test]
    public fun test_add_and_query_word() {
        let mut scenario = test_scenario::begin(@0x1);
        cloud::test_initialize(test_scenario::ctx(&mut scenario));
        scenario.next_tx(@0x1);

        let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
        let mut word_map = test_scenario::take_shared<WordMap>(&scenario);
        let config = test_scenario::take_shared<AdminConfig>(&scenario);

        let word = b"test";
        cloud::add_word(&mut word_map, &config, word, test_scenario::ctx(&mut scenario));

        let freq = cloud::get_word_frequency(&word_map, &word);
        assert!(freq == 1, 100);

        let words = cloud::get_words(&word_map);
        let mut found = false;
        let mut i = 0u64;
        loop {
            if (i >= vector::length(words)) break;
            let word_data = vector::borrow(words, i);
            if (cloud::get_word_text(word_data) == &word) {
                assert!(cloud::get_word_frequency_field(word_data) == 1, 101);
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, 102);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_shared(word_map);
        test_scenario::return_shared(config);
        test_scenario::end(scenario);
    }

    #[test]
    public fun test_remove_word() {
        let mut scenario = test_scenario::begin(@0x1);
        cloud::test_initialize(test_scenario::ctx(&mut scenario));
        scenario.next_tx(@0x1);

        let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
        let mut word_map = test_scenario::take_shared<WordMap>(&scenario);
        let config = test_scenario::take_shared<AdminConfig>(&scenario);

        let word = b"delete";
        cloud::add_word(&mut word_map, &config, word, test_scenario::ctx(&mut scenario));
        cloud::remove_word(&mut word_map, &admin_cap, 0);

        let freq = cloud::get_word_frequency(&word_map, &word);
        assert!(freq == 0, 103);
        let words = cloud::get_words(&word_map);
        assert!(vector::is_empty(words), 104);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_shared(word_map);
        test_scenario::return_shared(config);
        test_scenario::end(scenario);
    }

    #[test]
    public fun test_update_word() {
        let mut scenario = test_scenario::begin(@0x1);
        cloud::test_initialize(test_scenario::ctx(&mut scenario));
        scenario.next_tx(@0x1);

        let admin_cap = test_scenario::take_from_sender<AdminCap>(&scenario);
        let mut word_map = test_scenario::take_shared<WordMap>(&scenario);
        let config = test_scenario::take_shared<AdminConfig>(&scenario);

        let old_word = b"old";
        let new_word = b"new";

        cloud::add_word(&mut word_map, &config, old_word, test_scenario::ctx(&mut scenario));
        cloud::update_word(&mut word_map, &config, old_word, new_word, test_scenario::ctx(&mut scenario));

        let old_freq = cloud::get_word_frequency(&word_map, &old_word);
        let new_freq = cloud::get_word_frequency(&word_map, &new_word);

        assert!(old_freq == 0, 105);
        assert!(new_freq == 1, 106);

        let words = cloud::get_words(&word_map);
        let mut i = 0u64;
        let mut found = false;
        loop {
            if (i >= vector::length(words)) break;
            let wd = vector::borrow(words, i);
            if (cloud::get_word_text(wd) == &new_word) {
                assert!(cloud::get_word_frequency_field(wd) == 1, 107);
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, 108);

        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_shared(word_map);
        test_scenario::return_shared(config);
        test_scenario::end(scenario);
    }
}
