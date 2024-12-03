// pages/index.js
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createBurnInstruction, createTransferInstruction, getAssociatedTokenAddress, getAccount, createAssociatedTokenAccountInstruction } from '@solana/spl-token';

export default function Home() {
    // Keep all your existing state and functions here

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-4xl mx-auto p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Solana Token Manager</h1>
                    <WalletMultiButton />
                </div>

                {!connected ? (
                    <div className="text-center py-20">
                        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome to Solana Token Manager</h2>
                        <p className="text-gray-600 mb-4">Please connect your wallet to continue</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Wallet Info Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Wallet Information</h2>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">Address:</p>
                                <p className="font-mono text-gray-800 break-all">{publicKey.toString()}</p>
                                <p className="text-sm text-gray-600 mt-4">SOL Balance:</p>
                                <p className="font-semibold text-gray-800">{balance.toFixed(4)} SOL</p>
                            </div>
                        </div>

                        {/* Token Operations Card */}
                        <div className="bg-white rounded-lg shadow">
                            {/* Token Selection Header */}
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Token Operations</h2>
                                <select 
                                    onChange={(e) => setSelectedToken(e.target.value)}
                                    value={selectedToken || ""}
                                    className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a token</option>
                                    {tokens.map((token, index) => (
                                        <option key={index} value={token.mint}>
                                            {token.mint.slice(0, 8)}... ({token.amount})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedToken && (
                                <div className="p-6 space-y-8">
                                    {/* Transfer Section */}
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">Transfer Tokens</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Recipient Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={recipientAddress}
                                                    onChange={(e) => setRecipientAddress(e.target.value)}
                                                    placeholder="Enter recipient's Solana address"
                                                    className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Amount to Transfer
                                                </label>
                                                <input
                                                    type="number"
                                                    value={transferAmount}
                                                    onChange={(e) => setTransferAmount(e.target.value)}
                                                    min="0"
                                                    step="any"
                                                    placeholder="Enter amount"
                                                    className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <button
                                                onClick={transferToken}
                                                disabled={!transferAmount || !recipientAddress || loading}
                                                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Processing...' : 'Transfer Tokens'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Burn Section */}
                                    <div className="pt-6 border-t">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">Burn Tokens</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Amount to Burn
                                                </label>
                                                <input
                                                    type="number"
                                                    value={burnAmount}
                                                    onChange={(e) => setBurnAmount(e.target.value)}
                                                    min="0"
                                                    step="any"
                                                    placeholder="Enter amount"
                                                    className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <button
                                                onClick={burnToken}
                                                disabled={!burnAmount || loading}
                                                className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                {loading ? 'Processing...' : 'Burn Tokens'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Token List Card */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Tokens</h2>
                            <div className="space-y-4">
                                {tokens.map((token, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-2">Mint Address:</p>
                                        <p className="font-mono text-gray-800 break-all mb-2">{token.mint}</p>
                                        <p className="text-sm text-gray-600">Balance:</p>
                                        <p className="font-semibold text-gray-800">{token.amount}</p>
                                    </div>
                                ))}
                                {tokens.length === 0 && (
                                    <p className="text-gray-600 text-center py-4">No tokens found in wallet</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <p className="text-gray-800 font-medium">Processing Transaction...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}