import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useWordContext, PACKAGE_ID, WORD_MAP_ID, ADMIN_CONFIG_ID } from '../contexts/WordContext';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
    const { words, fetchMembers, fetchBannedWords, addMember } = useWordContext();
    const [members, setMembers] = useState<string[]>([]);
    const [bannedWords, setBannedWords] = useState<string[]>([]);
    const [currentMemberInput, setCurrentMemberInput] = useState('');
    const [currentBannedWordInput, setCurrentBannedWordInput] = useState('');
    const [error, setError] = useState('');
    const [isAddingMember, setIsAddingMember] = useState(false);

    // Fetch members and banned words when the panel opens
    useEffect(() => {
        if (isOpen) {
            fetchMembers().then(setMembers);
            fetchBannedWords().then(setBannedWords);
        }
    }, [isOpen, fetchMembers, fetchBannedWords]);

    const handleAddMember = async () => {
        const trimmedInput = currentMemberInput.trim();
        if (!trimmedInput) return;

        if (members.includes(trimmedInput)) {
            setError('This address is already a member');
            return;
        }

        setIsAddingMember(true);
        setError('');

        try {
            await addMember(trimmedInput);
            // Refresh the members list after adding
            const updatedMembers = await fetchMembers();
            setMembers(updatedMembers);
            setCurrentMemberInput('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add member');
        } finally {
            setIsAddingMember(false);
        }
    };

    const removeMember = (address: string) => {
        setMembers(members.filter(m => m !== address));
    };

    const addBannedWord = () => {
        const trimmedInput = currentBannedWordInput.trim();
        if (!trimmedInput) return;

        if (bannedWords.includes(trimmedInput)) {
            setError('This word is already banned');
            return;
        }

        setBannedWords([...bannedWords, trimmedInput]);
        setCurrentBannedWordInput('');
        setError('');
    };

    const removeBannedWord = (word: string) => {
        setBannedWords(bannedWords.filter(w => w !== word));
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-purple-600">Admin Panel</h2>
                            <motion.button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </motion.button>
                        </div>

                        <div className="space-y-8">
                            {/* Member Management */}
                            <section>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Member Management</h3>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={currentMemberInput}
                                        onChange={(e) => setCurrentMemberInput(e.target.value)}
                                        placeholder="Enter member address..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        disabled={isAddingMember}
                                    />
                                    <motion.button
                                        onClick={handleAddMember}
                                        className={`px-4 py-2 bg-purple-600 text-white rounded-lg ${isAddingMember ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        whileHover={!isAddingMember ? { scale: 1.05 } : {}}
                                        whileTap={!isAddingMember ? { scale: 0.95 } : {}}
                                        disabled={isAddingMember}
                                    >
                                        {isAddingMember ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <PlusIcon className="h-5 w-5" />
                                        )}
                                    </motion.button>
                                </div>
                                <div className="space-y-2">
                                    {members.map((address) => (
                                        <motion.div
                                            key={address}
                                            className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                        >
                                            <span className="text-sm font-mono">{address}</span>
                                            <motion.button
                                                onClick={() => removeMember(address)}
                                                className="text-red-500 hover:text-red-700"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>

                            {/* Banned Words */}
                            <section>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Banned Words</h3>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        value={currentBannedWordInput}
                                        onChange={(e) => setCurrentBannedWordInput(e.target.value)}
                                        placeholder="Enter word to ban..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <motion.button
                                        onClick={addBannedWord}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                    </motion.button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {bannedWords.map((word) => (
                                        <motion.span
                                            key={word}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                        >
                                            {word}
                                            <motion.button
                                                onClick={() => removeBannedWord(word)}
                                                className="text-red-500 hover:text-red-700"
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.8 }}
                                            >
                                                <XMarkIcon className="h-4 w-4" />
                                            </motion.button>
                                        </motion.span>
                                    ))}
                                </div>
                            </section>

                            {/* Debug Section */}
                            <section>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Debug Information</h3>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Contract IDs</h4>
                                        <div className="space-y-1">
                                            <div className="text-sm font-mono text-gray-600">
                                                Package ID: {PACKAGE_ID}
                                            </div>
                                            <div className="text-sm font-mono text-gray-600">
                                                Word Map ID: {WORD_MAP_ID}
                                            </div>
                                            <div className="text-sm font-mono text-gray-600">
                                                Admin Config ID: {ADMIN_CONFIG_ID}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">All Words</h4>
                                        <div className="space-y-1">
                                            {words.length === 0 ? (
                                                <div className="text-sm text-gray-500 italic">No words added yet</div>
                                            ) : (
                                                words.map((word, index) => (
                                                    <div key={index} className="text-sm font-mono text-gray-600">
                                                        {word.text} (frequency: {word.frequency})
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Members</h4>
                                        <div className="space-y-1">
                                            {members.length === 0 ? (
                                                <div className="text-sm text-gray-500 italic">No members added yet</div>
                                            ) : (
                                                members.map((address) => (
                                                    <div key={address} className="text-sm font-mono text-gray-600">
                                                        {address}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-gray-700 mb-2">Banned Words</h4>
                                        <div className="space-y-1">
                                            {bannedWords.length === 0 ? (
                                                <div className="text-sm text-gray-500 italic">No banned words</div>
                                            ) : (
                                                bannedWords.map((word) => (
                                                    <div key={word} className="text-sm font-mono text-gray-600">
                                                        {word}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {error && (
                            <motion.p
                                className="mt-4 text-red-500 text-sm"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
} 