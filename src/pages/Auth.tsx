import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowLeft, Loader2, Mail, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type AuthStep = 'email' | 'otp' | 'success';

const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signInWithGoogle } = useAuth();
  
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (user) {
      navigate('/feed');
    }
  }, [user, navigate]);

  useEffect(() => {
    const provider = searchParams.get('provider');
    if (provider === 'google') {
      handleGoogleSignIn();
    }
  }, [searchParams]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (data: EmailFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: window.location.origin + '/feed',
        },
      });

      if (otpError) throw otpError;

      setEmail(data.email);
      setStep('otp');
      setCountdown(60);
      toast.success('Check your email for the verification code');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (verifyError) throw verifyError;

      setStep('success');
      setTimeout(() => navigate('/feed'), 1500);
    } catch (err: any) {
      setError('Invalid code. Try again.');
      toast.error('Invalid code. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/feed',
        },
      });

      if (error) throw error;

      setCountdown(60);
      toast.success('New code sent!');
    } catch (err: any) {
      toast.error('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      {/* Back button */}
      <motion.div 
        className="absolute top-8 left-8 z-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link to="/">
          <motion.button 
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
            whileHover={{ x: -5 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </motion.button>
        </Link>
      </motion.div>

      <motion.div
        className="w-full max-w-md relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <motion.div 
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4 glow-primary"
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <TrendingUp className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2 font-heading">
            {step === 'success' ? 'Welcome!' : 'Sign in to InvestorPaisa'}
          </h1>
          {step === 'email' && (
            <p className="text-muted-foreground">Enter your email to continue</p>
          )}
          {step === 'otp' && (
            <p className="text-muted-foreground">Enter the code sent to {email}</p>
          )}
        </motion.div>

        {/* Main card */}
        <motion.div 
          className="glass rounded-3xl p-8 border border-border/50"
          variants={itemVariants}
        >
          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative group">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                              <Input 
                                placeholder="Enter your email" 
                                {...field} 
                                className="bg-secondary/50 border-border text-foreground placeholder-muted-foreground pl-12 h-14 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg" 
                                autoFocus
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground font-semibold py-4 h-14 rounded-xl hover:bg-primary/90 transition-all duration-300 glow-primary text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-4 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 py-4 h-14 px-6 rounded-xl border-2 border-border text-foreground font-medium hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300 bg-transparent"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Continue with Google</span>
                </Button>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    autoFocus
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot 
                          key={index} 
                          index={index}
                          className="w-12 h-14 text-2xl border-border bg-secondary/50 rounded-xl"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleOtpVerify}
                  className="w-full bg-primary text-primary-foreground font-semibold py-4 h-14 rounded-xl hover:bg-primary/90 transition-all duration-300 glow-primary text-lg"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Verify"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || isLoading}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                  </button>
                </div>

                <button
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError(null);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Use a different email
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1 }}
                >
                  <Check className="w-8 h-8 text-primary-foreground" />
                </motion.div>
                <h2 className="text-2xl font-bold mb-2 font-heading">Welcome!</h2>
                <p className="text-muted-foreground">Redirecting to your feed...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
