import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

const TokenModal = ({
    isOpen,
    onClose,
    balance,
    tokenBalance,
    onBurn,
    loading,
    error
}) => {
    const { publicKey } = useWallet();
    const [burnAmount, setBurnAmount] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Manage Tokens</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
                </div>

                <div className="space-y-4">
                    {publicKey && (
                        <>
                            <div>
                                <p className="text-sm text-gray-600">Wallet Address:</p>
                                <p className="font-mono text-sm break-all">{publicKey.toString()}</p>
                                <p className="text-sm text-gray-600 mt-2">SOL Balance:</p>
                                <p className="font-semibold">{balance.toFixed(4)} SOL</p>
                            </div>

                            {tokenBalance ? (
                                <div>
                                    <p className="text-sm text-gray-600">Token Balance:</p>
                                    <p className="font-semibold">{tokenBalance.amount}</p>

                                    <div className="mt-4">
                                        <input
                                            type="number"
                                            value={burnAmount}
                                            onChange={(e) => setBurnAmount(e.target.value)}
                                            placeholder="Amount to burn"
                                            className="w-full p-2 border rounded"
                                            min="0"
                                            max={tokenBalance.amount}
                                        />
                                        <button
                                            onClick={() => onBurn(burnAmount)}
                                            disabled={!burnAmount || loading}
                                            className="w-full mt-2 p-2 bg-red-600 text-white rounded disabled:bg-gray-300"
                                        >
                                            {loading ? 'Processing...' : 'Burn Tokens'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-600">No specific token found in wallet</p>
                            )}
                        </>
                    )}
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
        </div>
    );
};

export default TokenModal;
