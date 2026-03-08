import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Leaf, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-hero">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">LeafGrade</span>
        </div>

        {sent ? (
          <div className="card-elevated p-8 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-success mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Check your email</h2>
            <p className="text-muted-foreground">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <Link to="/auth">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <div className="card-elevated p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Reset Password</h2>
              <p className="text-muted-foreground mt-2">Enter your email to receive a reset link</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
              <Button type="submit" variant="enterprise" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
                Send Reset Link
              </Button>
            </form>
            <div className="text-center">
              <Link to="/auth" className="text-sm text-primary hover:underline">
                <ArrowLeft className="h-3.5 w-3.5 inline mr-1" />Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
