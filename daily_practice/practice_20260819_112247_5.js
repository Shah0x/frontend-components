class TrieNode {
    constructor() {
        // Refactor note: Using an object here, but ES6 Map might be cleaner for serialization?
        this.children = {}; 
        this.isEndOfWord = false;
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    /**
     * Inserts a word into the trie.
     * @param {string} word
     */
    insert(word) {
        if (!word) return;
        
        // TODO: Handle mixed casing. Right now "Apple" and "apple" will create separate paths.
        let current = this.root;
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (!current.children[char]) {
                current.children[char] = new TrieNode();
            }
            current = current.children[char];
        }
        current.isEndOfWord = true;
    }

    /**
     * Returns if the word is in the trie.
     * @param {string} word
     * @return {boolean}
     */
    search(word) {
        const node = this._navigate(word);
        return node !== null && node.isEndOfWord;
    }

    /**
     * Returns if there is any word in the trie that starts with the given prefix.
     * @param {string} prefix
     * @return {boolean}
     */
    startsWith(prefix) {
        return this._navigate(prefix) !== null;
    }

    /**
     * Helper to dry up the traversal logic for search and startsWith
     * @private
     */
    _navigate(str) {
        let current = this.root;
        for (let i = 0; i < str.length; i++) {
            const char = str[i];
            // console.log(`Checking char: ${char} in keys:`, Object.keys(current.children)); // debug log
            if (!current.children[char]) {
                return null;
            }
            current = current.children[char];
        }
        return current;
    }
}

// --- Quick Scratchpad manual verification ---
const trie = new Trie();
trie.insert("javascript");
trie.insert("java");

console.log("Search 'java':", trie.search("java")); // expected: true
console.log("Search 'jav':", trie.search("jav"));   // expected: false
console.log("StartsWith 'jav':", trie.startsWith("jav")); // expected: true

// TODO: Move this to a proper Jest spec file once environment is set up.
// trie.insert("TypeScript"); 
// console.log("Search 'typescript' (lowercase check):", trie.search("typescript")); // fails right now because of case-sensitivity