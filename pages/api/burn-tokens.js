const burnTokens = async (token) => {
    if (!publicKey || !connection) {
      setError('Wallet not connected');
      return;
    }
  
    const amountToBurn = parseFloat(burnAmount[token.mint]) || 0;
    if (amountToBurn <= 0 || amountToBurn > token.amount) {
      setError('Invalid burn amount.');
      return;
    }
  
    setLoadingToken(token.mint);
  
    try {
      setError('');
  
      // Create burn transaction
      const burnAmountInLamports = amountToBurn * Math.pow(10, token.decimals);
      const transaction = new Transaction().add(
        createBurnInstruction(token.tokenAccount, new PublicKey(token.mint), publicKey, burnAmountInLamports, [])
      );
  
      // Add recent blockhash and fee payer
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = publicKey;
  
      // Request Phantom to sign the transaction
      const signedTransaction = await signTransaction(transaction);
      const transactionSignature = await connection.sendRawTransaction(signedTransaction.serialize());
      await connection.confirmTransaction(transactionSignature);
      setBurnTxSignature(transactionSignature);
  
      // Send the transaction signature to the backend for verification and updating virtual balance
      const response = await fetch('/api/burn-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionSignature,
          publicKey: publicKey.toString(),
          amountBurned: amountToBurn,
        }),
      });
  
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error);
      }
  
      // Update virtual balance after successful burn
      const newVirtualBalance = virtualBalance + amountToBurn;
      setVirtualBalance(newVirtualBalance);
      updateVirtualBalance(newVirtualBalance);
    } catch (err) {
      console.error('Error while burning:', err);
      setError(`Burning tokens failed: ${err.message}`);
    } finally {
      setLoadingToken('');
    }
  };
  