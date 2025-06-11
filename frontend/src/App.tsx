import '@mysten/dapp-kit/dist/index.css'; // ✅ Required for ConnectButton and modal styles
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WordProvider } from './contexts/WordContext';
import { TagCloud } from './components/TagCloud';
import { WelcomeCard } from './components/WelcomeCard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={{ testnet: { url: getFullnodeUrl('testnet') } }} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <WordProvider>
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
              <TagCloud />
              <div className="relative z-10">
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
