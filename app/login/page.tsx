'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';

/**
 * Modern Glass Effect Login Page
 * With detailed 3D abstract background shapes
 */
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  type AuthMode = 'login' | 'signup';
  const [mode, setMode] = useState<AuthMode>('signup');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    const m = searchParams?.get('mode');
    if (m === 'signup') setMode('signup');
    if (m === 'login') setMode('login');
  }, [searchParams]);

  const redirectAfterAuth = async () => {
    const redirectUrl = searchParams.get('callbackUrl') || '/dashboard';
    // Give NextAuth a moment to populate the session cookie/token
    const session = await getSession();
    if (session) {
      router.push(redirectUrl);
      router.refresh();
      return;
    }
    // Fallback: still redirect even if session fetch race-loses
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 500);
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
      }
    };
    checkSession();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
      
      const result = await signIn('credentials', {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl: callbackUrl,
      });

      if (result?.error) {
        let errorMessage = result.error;
        if (result.error.includes('Invalid email') || result.error.includes('Invalid password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (result.error.includes('No user found')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (result.error.includes('Please provide')) {
          errorMessage = 'Please provide both email and password.';
        }
        setError(errorMessage);
        setLoading(false);
      } else if (result?.ok) {
        // Success - wait a moment for session to be set, then redirect
        setLoading(false);
        
        // Verify session was created
        const session = await getSession();
        if (session) {
          // Use the callbackUrl from query params or default to dashboard
          const redirectUrl = searchParams.get('callbackUrl') || '/dashboard';
          router.push(redirectUrl);
          router.refresh();
        } else {
          // If session not set, force redirect anyway
          setTimeout(() => {
            const redirectUrl = searchParams.get('callbackUrl') || '/dashboard';
            window.location.href = redirectUrl;
          }, 500);
        }
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match.');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signupName.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setSignupError(data?.error || 'Sign up failed. Please try again.');
        setSignupLoading(false);
        return;
      }

      // Log the user in using your existing NextAuth credentials provider.
      const loginResult = await signIn('credentials', {
        email: signupEmail.trim(),
        password: signupPassword.trim(),
        redirect: false,
      });

      if (loginResult?.error) {
        setSignupError('Account created, but sign-in failed. Please try logging in.');
        setSignupLoading(false);
        return;
      }

      setSignupLoading(false);
      await redirectAfterAuth();
    } catch (err: any) {
      console.error('Signup error:', err);
      setSignupError(err?.message || 'An error occurred. Please try again.');
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
      {/* Detailed 3D Abstract Background Shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large C-shaped blob - top left */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 left-20 w-80 h-80 bg-blue-400/20 rounded-[40%] blur-2xl transform rotate-12"></div>
        
        {/* Wavy tubular shapes - middle left */}
        <div className="absolute top-1/3 left-0 w-64 h-96 bg-blue-400/25 rounded-full blur-3xl transform -rotate-12"></div>
        <div className="absolute top-1/2 left-20 w-72 h-64 bg-blue-300/20 rounded-full blur-2xl transform rotate-45"></div>
        
        {/* Cloud-like blobs - bottom right */}
        <div className="absolute bottom-10 right-10 w-[500px] h-96 bg-blue-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-400/20 rounded-[60%] blur-2xl transform -rotate-12"></div>
        
        {/* Z/N shaped blob - middle right */}
        <div className="absolute top-1/3 right-0 w-96 h-64 bg-blue-400/25 rounded-full blur-3xl transform rotate-12"></div>
        <div className="absolute top-1/2 right-20 w-72 h-96 bg-blue-300/20 rounded-full blur-2xl transform -rotate-45"></div>
        
        {/* Curved pipe structures */}
        <div className="absolute top-0 right-1/4 w-96 h-[600px] bg-blue-500/15 rounded-full blur-3xl transform rotate-45"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-[500px] bg-blue-400/20 rounded-full blur-3xl transform -rotate-45"></div>
        
        {/* Center floating shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300/15 rounded-full blur-2xl"></div>
        
        {/* Additional layered shapes for depth */}
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-400/25 rounded-full blur-3xl"></div>
      </div>

      {/* Split Auth Layout */}
      <div className="relative z-10 w-full max-w-5xl mx-4">
        <div className="flex flex-col lg:flex-row items-stretch">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 md:p-10 w-full lg:w-1/2 lg:rounded-r-none">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4 border border-white/30">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{mode === 'login' ? 'Login' : 'Sign Up'}</h1>
            <p className="text-white/80 text-sm">
              {mode === 'login' ? 'Sign in to access the admin panel' : 'Create an account to get started'}
            </p>
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="mt-4 text-sm text-white/90 hover:text-white transition-colors underline"
            >
              {mode === 'login' ? 'New user? Sign up' : 'Already member? Sign in'}
            </button>
          </div>

          <form
            onSubmit={mode === 'login' ? handleSubmit : handleSignup}
            className="space-y-6"
          >
            {mode === 'login' ? (
              error && (
                <div className="backdrop-blur-sm bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )
            ) : (
              signupError && (
                <div className="backdrop-blur-sm bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm">
                  {signupError}
                </div>
              )
            )}
            

            {/* Name Field (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="signupName" className="block text-sm font-medium text-white/90 mb-2">
                  Name
                </label>
                <input
                  id="signupName"
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                  placeholder="Your name"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={mode === 'login' ? email : signupEmail}
                onChange={(e) => (mode === 'login' ? setEmail(e.target.value) : setSignupEmail(e.target.value))}
                required
                className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                placeholder="username@gmail.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor={mode === 'login' ? 'password' : 'signupPassword'} className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id={mode === 'login' ? 'password' : 'signupPassword'}
                  type={showPassword ? 'text' : 'password'}
                  value={mode === 'login' ? password : signupPassword}
                  onChange={(e) => (mode === 'login' ? setPassword(e.target.value) : setSignupPassword(e.target.value))}
                  required
                  className="w-full px-4 py-3 pr-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label htmlFor="signupConfirmPassword" className="block text-sm font-medium text-white/90 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="signupConfirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pr-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                    placeholder="Confirm Password"
                  />
                </div>
              </div>
            )}

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-white/80 hover:text-white transition-colors">
                  Forgot Password?
                </a>
              </div>
            )}

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={mode === 'login' ? loading : signupLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {mode === 'login' ? (
                loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )
              ) : signupLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </span>
              ) : (
                'Sign up'
              )}
            </button>

            {/* Divider */}
            {mode === 'login' && (
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-white/60">or continue with</span>
                </div>
              </div>
            )}

            {/* Social Login Buttons */}
            {mode === 'login' && (
              <div className="grid grid-cols-3 gap-4">
                {/* Keep your existing social login buttons (UI only; login logic unchanged) */}
                <button
                  type="button"
                  className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full transition-all"
                  title="Sign in with Google"
                >
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full transition-all"
                  title="Sign in with GitHub"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23 1.957-.545 4.05-.545 6.007 0 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 rounded-full transition-all"
                  title="Sign in with Facebook"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Default Credentials Hint */}
            {mode === 'login' && (
              <div className="text-center mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <p className="text-white/80 text-xs mb-1">Default Credentials:</p>
                <p className="text-white text-sm font-mono">admin@rootkit.dev / admin123</p>
              </div>
            )}
          </form>
          </div>

          {/* Right-side illustration panel (UI only) */}
          <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-500">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

            <div className="relative h-full p-10 flex items-center justify-center">
              <div className="w-full max-w-sm">
                <div className="bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-white/80 text-sm font-medium">Inbox</div>
                    <div className="text-white/60 text-xs">Today</div>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
                    <div className="text-white text-3xl font-bold">176,18</div>
                    <div className="mt-2 h-10 rounded-lg bg-white/5" />
                  </div>
                  <div className="mt-4 flex gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">+</div>
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">✓</div>
                  </div>
                </div>

                <div className="mt-6 bg-white/10 border border-white/20 rounded-3xl p-6 backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">→</div>
                    <div>
                      <div className="text-white font-semibold">Your data, your rules</div>
                      <div className="text-white/70 text-xs">One place to manage everything.</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded" />
                    <div className="h-3 bg-white/10 rounded w-10/12" />
                    <div className="h-3 bg-white/10 rounded w-8/12" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
