-- Create transactions table for financial records
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_purchase', 'booking_payment', 'refund', 'withdrawal')),
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method TEXT, -- 'vnpay', 'momo', 'stripe', 'manual'
  reference_id TEXT, -- External payment reference
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_id) WHERE reference_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: System/authenticated users can insert transactions
CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: System can update transaction status
CREATE POLICY "System can update transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some useful database functions

-- Function to get user's transaction summary
CREATE OR REPLACE FUNCTION get_transaction_summary(p_user_id UUID)
RETURNS TABLE (
  total_credits_purchased NUMERIC,
  total_spent NUMERIC,
  total_refunded NUMERIC,
  transaction_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN type = 'credit_purchase' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_credits_purchased,
    COALESCE(SUM(CASE WHEN type = 'booking_payment' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_spent,
    COALESCE(SUM(CASE WHEN type = 'refund' AND status = 'completed' THEN amount ELSE 0 END), 0) as total_refunded,
    COUNT(*)::INTEGER as transaction_count
  FROM transactions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE transactions IS 'Financial transactions including credit purchases, booking payments, and refunds';
COMMENT ON COLUMN transactions.type IS 'Type of transaction: credit_purchase, booking_payment, refund, withdrawal';
COMMENT ON COLUMN transactions.status IS 'Transaction status: pending, completed, failed, cancelled';
COMMENT ON COLUMN transactions.payment_method IS 'Payment provider: vnpay, momo, stripe, manual';
COMMENT ON COLUMN transactions.reference_id IS 'External payment gateway reference ID';
COMMENT ON COLUMN transactions.metadata IS 'Additional transaction data in JSON format';
