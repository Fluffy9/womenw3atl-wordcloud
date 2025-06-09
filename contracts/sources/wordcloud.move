module wordcloud::cloud {
    use sui::table;

    public struct AdminCap has key {
        id: object::UID,
    }

    public struct WordData has copy, drop, store {
        text: vector<u8>,
        frequency: u64,
    }

    public struct WordMap has key {
        id: object::UID,
        words: vector<WordData>,
        word_index: table::Table<vector<u8>, u64>,
    }

    public struct AdminConfig has key {
        id: object::UID,
        members: vector<address>,
        banned_words: vector<vector<u8>>,
    }

    public entry fun initialize(ctx: &mut tx_context::TxContext) {
        let creator = tx_context::sender(ctx);

        let word_map = WordMap {
            id: object::new(ctx),
            words: vector::empty(),
            word_index: table::new<vector<u8>, u64>(ctx),
        };

        let admin_config = AdminConfig {
            id: object::new(ctx),
            members: vector::singleton(creator),
            banned_words: vector::empty(),
        };

        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        transfer::share_object(word_map);
        transfer::share_object(admin_config);
        transfer::transfer(admin_cap, creator);
    }

    public entry fun transfer_admin_config(config: AdminConfig, new_owner: address, ctx: &mut tx_context::TxContext) {
        transfer::transfer(config, new_owner);
    }

    public entry fun transfer_admin_cap(cap: AdminCap, new_owner: address, ctx: &mut tx_context::TxContext) {
        transfer::transfer(cap, new_owner);
    }

    public fun add_member(config: &mut AdminConfig, _admin: &AdminCap, new_member: address) {
        vector::push_back(&mut config.members, new_member);
    }

    public fun ban_word(config: &mut AdminConfig, _admin: &AdminCap, word: vector<u8>) {
        vector::push_back(&mut config.banned_words, word);
    }

    fun clone_vec_u8(v: &vector<u8>): vector<u8> {
        let mut result = vector::empty<u8>();
        let len = vector::length(v);
        let mut i = 0;
        loop {
            if (i >= len) break;
            let b = *vector::borrow(v, i);
            vector::push_back(&mut result, b);
            i = i + 1;
        };
        result
    }

    fun decrement_or_remove(table_ref: &mut table::Table<vector<u8>, u64>, key: vector<u8>) {
        if (table::contains(table_ref, key)) {
            let freq = table::borrow_mut(table_ref, key);
            assert!(*freq > 0, 100);
            *freq = *freq - 1;
            if (*freq == 0) {
                table::remove(table_ref, key);
            }
        }
    }

    public fun add_word(word_map: &mut WordMap, config: &AdminConfig, word: vector<u8>, ctx: &tx_context::TxContext) {
        let sender = tx_context::sender(ctx);

        assert!(vector::contains(&config.members, &sender), 1);
        assert!(vector::length(&word) <= 20, 2);
        assert!(!vector::contains(&config.banned_words, &word), 3);

        let word_key = clone_vec_u8(&word);

        if (table::contains(&word_map.word_index, word_key)) {
            let freq = table::borrow_mut(&mut word_map.word_index, word_key);
            *freq = *freq + 1;

            let len = vector::length(&word_map.words);
            let mut i = 0;
            loop {
                if (i >= len) break;
                let wd_ref = vector::borrow_mut(&mut word_map.words, i);
                if (wd_ref.text == word) {
                    wd_ref.frequency = wd_ref.frequency + 1;
                    break
                };
                i = i + 1;
            }
        } else {
            table::add(&mut word_map.word_index, word_key, 1);
            let wd = WordData { text: word, frequency: 1 };
            vector::push_back(&mut word_map.words, wd);
        }
    }

    public fun remove_word(word_map: &mut WordMap, _admin: &AdminCap, index: u64) {
        let wd = vector::borrow(&word_map.words, index);
        let word_key = clone_vec_u8(&wd.text);
        decrement_or_remove(&mut word_map.word_index, word_key);
        vector::swap_remove(&mut word_map.words, index);
    }

    public fun update_word(word_map: &mut WordMap, config: &AdminConfig, old_word: vector<u8>, new_word: vector<u8>, ctx: &tx_context::TxContext) {
        let sender = tx_context::sender(ctx);

        assert!(vector::contains(&config.members, &sender), 5);
        assert!(vector::length(&new_word) <= 20, 6);
        assert!(!vector::contains(&config.banned_words, &new_word), 7);

        let old_key = clone_vec_u8(&old_word);
        let new_key = clone_vec_u8(&new_word);

        decrement_or_remove(&mut word_map.word_index, old_key);

        if (table::contains(&word_map.word_index, new_key)) {
            let freq = table::borrow_mut(&mut word_map.word_index, new_key);
            *freq = *freq + 1;

            let len = vector::length(&mut word_map.words);
            let mut i = 0;
            loop {
                if (i >= len) break;
                let wd_ref = vector::borrow_mut(&mut word_map.words, i);
                if (wd_ref.text == new_word) {
                    wd_ref.frequency = wd_ref.frequency + 1;
                    break
                };
                i = i + 1;
            };
        } else {
            table::add(&mut word_map.word_index, new_key, 1);
            let wd = WordData { text: new_word, frequency: 1 };
            vector::push_back(&mut word_map.words, wd);
        }
    }

    public fun get_all_words(word_map: &WordMap): &vector<WordData> {
        &word_map.words
    }

    public fun get_word_frequency(word_map: &WordMap, word: &vector<u8>): u64 {
        let word_key = clone_vec_u8(word);
        if (table::contains(&word_map.word_index, word_key)) {
            *table::borrow(&word_map.word_index, word_key)
        } else {
            0
        }
    }

    public fun get_words(map: &WordMap): &vector<WordData> {
        &map.words
    }

    public fun get_word_index(map: &WordMap): &table::Table<vector<u8>, u64> {
        &map.word_index
    }

    public fun get_members(config: &AdminConfig): &vector<address> {
        &config.members
    }

    public fun get_banned_words(config: &AdminConfig): &vector<vector<u8>> {
        &config.banned_words
    }

    public fun get_word_text(data: &WordData): &vector<u8> {
        &data.text
    }

    public fun get_word_frequency_field(data: &WordData): u64 {
        data.frequency
    }

    #[test_only]
    public fun test_initialize(ctx: &mut tx_context::TxContext) {
        initialize(ctx);
    }

    public entry fun transfer_word_map(word_map: WordMap, new_owner: address, _ctx: &mut tx_context::TxContext) {
        transfer::transfer(word_map, new_owner);
    }


}
