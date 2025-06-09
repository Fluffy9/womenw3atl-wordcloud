import { ConnectButton as SuiConnectButton } from '@mysten/dapp-kit';

export function ConnectButton() {
    return (
        <div className="w-full">
            <SuiConnectButton className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors" />
        </div>
    );
} 