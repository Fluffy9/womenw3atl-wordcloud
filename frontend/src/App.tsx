import '@mysten/dapp-kit/dist/index.css'; // ✅ Required for ConnectButton and modal styles
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WelcomeCard } from './components/WelcomeCard';
import { TagCloud } from './components/TagCloud';
import { WordProvider } from './contexts/WordContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{ testnet: { url: getFullnodeUrl('testnet') } }} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <WordProvider>
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white relative">
              <TagCloud />
              <div className="container mx-auto px-4 py-8 relative z-10">
                <WelcomeCard />
              </div>
            </div>
          </WordProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
