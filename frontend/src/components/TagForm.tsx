import { useState, useEffect } from 'react';
import { useCurrentWallet, useDisconnectWallet } from '@mysten/dapp-kit';
import { PlusIcon, XMarkIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { createAvatar } from '@dicebear/core';
import { identicon } from '@dicebear/collection';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminPanel } from './AdminPanel';
import { useWordContext } from '../contexts/WordContext';

const MAX_WORDS = 10;
const MAX_WORD_LENGTH = 20;

// Test data to demonstrate functionality
const TEST_WORDS = [
    'community',
    'learning',
    'networking',
    'opportunities'
];

function truncateAddress(address: string | undefined): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getWalletInitial(address: string | undefined): string {
    if (!address) return '?';
    return address.slice(0, 1).toUpperCase();
}

export function TagForm() {
    const { currentWallet } = useCurrentWallet();
    const { mutate: disconnect } = useDisconnectWallet();
    const { words, addWord, removeWord, error: wordError, maxWords, maxWordLength, fetchMembers, isAdmin, fetchWordsFromChain } = useWordContext();
    const [currentInput, setCurrentInput] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
    const [isMember, setIsMember] = useState<boolean | null>(null);

    const walletAddress = currentWallet?.accounts[0]?.address;

    useEffect(() => {
        if (walletAddress) {
            const generateAvatar = async () => {
                const avatar = await createAvatar(identicon, {
                    seed: walletAddress,
                    size: 24,
                    backgroundColor: ['#7c3aed'], // purple-600
                });
                const svg = await avatar.toDataUri();
                setAvatarUrl(svg);
            };
            generateAvatar();

            // Check if user is a member and fetch words
            const checkMembership = async () => {
                const members = await fetchMembers();
                setIsMember(members.includes(walletAddress));
                // Fetch words after checking membership
                await fetchWordsFromChain();
            };
            checkMembership();
        }
    }, [walletAddress, fetchMembers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCurrentInput(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddWord();
        }
    };

    const handleAddWord = async () => {
        await addWord(currentInput);
        setCurrentInput('');
    };

    return (
        <div className="relative">
            <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-purple-600">What Do You Hope to Gain?</h2>
                    <p className="text-gray-600 mt-2">Add up to {maxWords} words (max {maxWordLength} characters each)</p>
                </div>

                <AnimatePresence>
                    {walletAddress && (
                        <motion.div
                            className="flex items-center justify-center gap-3 mb-2"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                            <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-full">
                                {avatarUrl ? (
                                    <motion.img
                                        src={avatarUrl}
                                        alt="Wallet avatar"
                                        className="w-6 h-6 rounded-full"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                ) : (
                                    <motion.div
                                        className="w-6 h-6 rounded-full bg-purple-600"
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            opacity: [0.5, 1, 0.5]
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                )}
                                <span className="text-sm text-purple-700 font-medium">
                                    {truncateAddress(walletAddress)}
                                </span>
                                <motion.button
                                    onClick={() => disconnect()}
                                    className="px-2 py-0.5 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-full transition-colors"
                                    title="Disconnect wallet"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Disconnect
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {isMember === null ? (
                    <motion.div
                        className="text-center text-gray-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Checking membership status...
                    </motion.div>
                ) : isMember ? (
                    <motion.div
                        className="space-y-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="flex gap-2 p-2 border border-gray-200 rounded-lg bg-white">
                            <input
                                type="text"
                                value={currentInput}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a word..."
                                className="flex-1 outline-none text-sm"
                                maxLength={maxWordLength}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">{words.length}/{maxWords}</span>
                                <motion.button
                                    type="button"
                                    onClick={handleAddWord}
                                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                    title="Add word"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <PlusIcon className="h-4 w-4" />
                                </motion.button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {wordError && (
                                <motion.p
                                    className="text-red-500 text-sm"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {wordError}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <motion.div
                            className="flex flex-wrap gap-2"
                            layout
                        >
                            <AnimatePresence>
                                {words.map((word, index) => (
                                    <motion.span
                                        key={`${word.text}-${index}`}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        layout
                                    >
                                        {word.text}
                                        <motion.button
                                            type="button"
                                            onClick={() => removeWord(index)}
                                            className="text-purple-500 hover:text-purple-700"
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.8 }}
                                        >
                                            <XMarkIcon className="h-4 w-4" />
                                        </motion.button>
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        className="text-center p-4 bg-yellow-50 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <p className="text-yellow-700">
                            You are not a member yet. Please contact an admin to get access.
                        </p>
                    </motion.div>
                )}
            </motion.div>

            <AnimatePresence>
                {walletAddress && isAdmin && (
                    <motion.button
                        onClick={() => setIsAdminPanelOpen(true)}
                        className="fixed bottom-6 right-6 p-3 bg-white shadow-lg rounded-full text-gray-400 hover:text-gray-600 z-10"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.1, rotate: 15 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Cog6ToothIcon className="h-6 w-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {isAdmin && (
                <AdminPanel
                    isOpen={isAdminPanelOpen}
                    onClose={() => setIsAdminPanelOpen(false)}
                />
            )}
        </div>
    );
} 