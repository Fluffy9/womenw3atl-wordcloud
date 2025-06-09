import { ConnectButton } from './ConnectButton';
import { TagForm } from './TagForm';
import { useCurrentWallet } from '@mysten/dapp-kit';

export function WelcomeCard() {
    const { currentWallet } = useCurrentWallet();

    console.log('Current Wallet:', currentWallet);

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">

                {/* Logo */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-purple-600">WomenW3ATL</h1>
                </div>

                {currentWallet ? (
                    <TagForm />
                ) : (
                    <>
                        {/* Prompt */}
                        <div className="text-center mb-8">
                            <p className="text-xl text-gray-700 italic">
                                "What Do You Hope to Gain By Being in The Web3 Space?"
                            </p>
                        </div>

                        {/* Connect Button */}
                        <div className="flex justify-center">
                            <ConnectButton />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
} 