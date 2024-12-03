// pages/terms.js
export default function Terms() {
    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <div className="space-y-4">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <section>
                    <h2 className="text-2xl font-semibold mb-3">Usage Agreement</h2>
                    <p>By using this application, you agree to these terms and understand that token burning operations are irreversible.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold mb-3">User Responsibilities</h2>
                    <p>Users are responsible for verifying all transaction details before confirming any token burn operations.</p>
                </section>
                <section>
                    <h2 className="text-2xl font-semibold mb-3">Disclaimer</h2>
                    <p>This application does not guarantee the success of transactions and is not responsible for any losses incurred through its use.</p>
                </section>
            </div>
        </div>
    );
}