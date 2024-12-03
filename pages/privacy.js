// pages/privacy.js
export default function Privacy() {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <div className="space-y-4">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <section>
                    <h2 className="text-2xl font-semibold mb-3">Overview</h2>
                    <p>This application allows users to burn Solana tokens. We do not collect or store any personal data.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold mb-3">Wallet Connection</h2>
                    <p>When you connect your Phantom wallet, we only access public blockchain data necessary for token operations.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold mb-3">Data Collection</h2>
                    <p>We do not collect, store, or share any personal information. All operations are conducted directly on the Solana blockchain.</p>
                </section>
            </div>
        </div>
    );
}