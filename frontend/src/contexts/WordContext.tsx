import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useCurrentWallet, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { bcs } from '@mysten/sui.js/bcs';

interface WordData {
    text: string;
    frequency: number;
}

interface WordContextType {
    words: WordData[];
    error: string | null;
    isLoading: boolean;
    addWord: (word: string) => Promise<void>;
    removeWord: (index: number) => Promise<void>;
    fetchWordsFromChain: () => Promise<void>;
    fetchWordFrequency: (word: string) => Promise<number>;
    fetchMembers: () => Promise<string[]>;
    fetchBannedWords: () => Promise<string[]>;
    addMember: (address: string) => Promise<void>;
    isAdmin: boolean;
    maxWords: number;
    maxWordLength: number;
}

const WordContext = createContext<WordContextType | undefined>(undefined);

export const PACKAGE_ID = '0xc0b147933e929488fe20f367a269cdabcb8d78a3bd704a33b5f5c7ce69dc0ca9';
export const WORD_MAP_ID = '0xc92c82b962e8c384bc788139c91ffa83dab84995347f5b44e532e0141b29cc9c';
export const ADMIN_CONFIG_ID = '0x84f3441c0982891ca8e4ad8efcb3363936862fba767ffcda6640bc269b4b58cc';
export const ADMIN_CAP_ID = '0xd48c0ab943bb84b19590990882f9b80d0b1fc33ef3c4cb3352d9f7dc865fba0f';

// Use local proxy in development, direct URL in production
const SUI_RPC_URL = process.env.NODE_ENV === 'development'
    ? '/sui'
    : getFullnodeUrl('testnet');

const publicSuiClient = new SuiClient({ url: SUI_RPC_URL });

// Helper functions for case handling
const toCamelCase = (str: string): string => {
    return str.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    });
};

const mergeCaseInsensitiveWords = (words: WordData[]): WordData[] => {
    const wordMap = new Map<string, WordData>();

    words.forEach(word => {
        const lowerText = word.text.toLowerCase();
        const existing = wordMap.get(lowerText);

        if (existing) {
            existing.frequency += word.frequency;
        } else {
            wordMap.set(lowerText, {
                text: toCamelCase(word.text),
                frequency: word.frequency
            });
        }
    });

    return Array.from(wordMap.values());
};

export const WordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentWallet } = useCurrentWallet();
    const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
    const [words, setWords] = useState<WordData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!currentWallet?.accounts[0]?.address) {
                setIsAdmin(false);
                return;
            }

            try {
                const result = await publicSuiClient.getObject({
                    id: ADMIN_CAP_ID,
                    options: { showOwner: true }
                });

                let ownerAddress: string | undefined = undefined;
                if (result.data && result.data.owner && typeof result.data.owner === 'object' && 'AddressOwner' in result.data.owner) {
                    ownerAddress = (result.data.owner as { AddressOwner: string }).AddressOwner;
                }
                setIsAdmin(ownerAddress === currentWallet.accounts[0].address);
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            }
        };

        checkAdminStatus();
    }, [currentWallet?.accounts[0]?.address]);

    const addWord = async (word: string) => {
        if (!currentWallet) {
            setError('No wallet connected');
            return;
        }

        const trimmedWord = word.trim();
        if (!trimmedWord) {
            setError('Word cannot be empty');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const tx = new TransactionBlock();
            // Convert to lowercase before sending to contract
            const lowerWord = trimmedWord.toLowerCase();
            const wordBytes = new Uint8Array(new TextEncoder().encode(lowerWord));
            const serializedWord = bcs.vector(bcs.u8()).serialize(wordBytes);

            tx.moveCall({
                target: `${PACKAGE_ID}::cloud::add_word`,
                arguments: [
                    tx.object(WORD_MAP_ID),
                    tx.object(ADMIN_CONFIG_ID),
                    tx.pure(serializedWord),
                ],
            });

            await signAndExecute({
                transaction: tx,
                chain: 'sui:testnet',
            });

            // Fetch the updated word list after adding the word
            await fetchWordsFromChain();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add word');
        } finally {
            setIsLoading(false);
        }
    };

    const removeWord = async (index: number) => {
        if (!currentWallet) {
            setError('No wallet connected');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const tx = new TransactionBlock();
            const indexBytes = new Uint8Array(new BigUint64Array([BigInt(index)]).buffer);

            tx.moveCall({
                target: `${PACKAGE_ID}::cloud::remove_word`,
                arguments: [
                    tx.object(WORD_MAP_ID),
                    tx.object(ADMIN_CONFIG_ID),
                    tx.pure(indexBytes),
                ],
            });

            await signAndExecute({
                transaction: tx,
                chain: 'sui:testnet',
            });

            setWords(words.filter((_, i) => i !== index));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove word');
        } finally {
            setIsLoading(false);
        }
    };

    const addMember = async (newMemberAddress: string) => {
        console.log('addMember function called');
        if (!currentWallet) {
            setError('No wallet connected');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('Adding member:', newMemberAddress);
            console.log('Current wallet:', currentWallet.accounts[0].address);
            console.log('Package ID:', PACKAGE_ID);
            console.log('Admin Config ID:', ADMIN_CONFIG_ID);
            console.log('Admin Cap ID:', ADMIN_CAP_ID);

            const tx = new TransactionBlock();
            const serializedAddress = bcs.Address.serialize(newMemberAddress);
            console.log('Serialized address bytes:', serializedAddress.toBytes());

            tx.moveCall({
                target: `${PACKAGE_ID}::cloud::add_member`,
                arguments: [
                    tx.object(ADMIN_CONFIG_ID),
                    tx.object(ADMIN_CAP_ID),
                    tx.pure(serializedAddress),
                ],
            });

            console.log('Transaction built:', tx.serialize());

            const result = await signAndExecute({
                transaction: tx,
                chain: 'sui:testnet',
            });

            console.log('Transaction result:', {
                digest: result.digest,
                effects: result.effects
            });
        } catch (err) {
            console.error('Error adding member:', err);
            if (err instanceof Error) {
                console.error('Error details:', {
                    name: err.name,
                    message: err.message,
                    stack: err.stack
                });
            }
            setError(err instanceof Error ? err.message : 'Failed to add member');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchWordsFromChain = async () => {
        try {
            const result = await publicSuiClient.getObject({
                id: WORD_MAP_ID,
                options: { showContent: true }
            });

            if (result.data?.content?.dataType === 'moveObject') {
                const fields = (result.data.content as any).fields;
                const words = fields.words || [];

                const decodedWords = words.map((word: any) => ({
                    text: new TextDecoder().decode(new Uint8Array(word.fields.text)),
                    frequency: Number(word.fields.frequency)
                }));

                // Merge case-insensitive duplicates and convert to camel case
                const mergedWords = mergeCaseInsensitiveWords(decodedWords);
                setWords(mergedWords);
            } else {
                console.log('No words found in the contract');
                setWords([]);
            }
        } catch (error) {
            console.error('Error fetching words:', error);
            setWords([]);
        }
    };

    const fetchWordFrequency = async (word: string): Promise<number> => {
        try {
            // Convert to lowercase before querying
            const lowerWord = word.toLowerCase();
            const wordBytes = new Uint8Array(Buffer.from(lowerWord));

            const result = await publicSuiClient.call(`${PACKAGE_ID}::cloud::get_word_frequency`, [WORD_MAP_ID, wordBytes]);

            return Number(result);
        } catch {
            return 0;
        }
    };

    const fetchMembers = async (): Promise<string[]> => {
        try {
            const result = await publicSuiClient.getObject({
                id: ADMIN_CONFIG_ID,
                options: { showContent: true }
            });

            if (result.data?.content?.dataType === 'moveObject') {
                const fields = (result.data.content as any).fields;
                return fields.members || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching members:', error);
            return [];
        }
    };

    const fetchBannedWords = async (): Promise<string[]> => {
        try {
            const result = await publicSuiClient.call(`${PACKAGE_ID}::cloud::get_banned_words`, [ADMIN_CONFIG_ID]);

            return (result as any[]).map((b) => Buffer.from(b).toString());
        } catch {
            return [];
        }
    };

    return (
        <WordContext.Provider
            value={{
                words,
                error,
                isLoading,
                addWord,
                removeWord,
                fetchWordsFromChain,
                fetchWordFrequency,
                fetchMembers,
                fetchBannedWords,
                addMember,
                isAdmin,
                maxWords: 10,
                maxWordLength: 20,
            }}
        >
            {children}
        </WordContext.Provider>
    );
};

export const useWordContext = () => {
    const context = useContext(WordContext);
    if (context === undefined) {
        throw new Error('useWordContext must be used within a WordProvider');
    }
    return context;
};
