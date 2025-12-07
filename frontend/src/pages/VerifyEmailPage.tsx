import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button, Card } from '@/components/common';
import { ROUTES } from '@/utils/constants';
import api from '@/services/api';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent duplicate calls in React Strict Mode
      if (hasVerified.current) return;
      hasVerified.current = true;

      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await api.post(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate(ROUTES.LOGIN);
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        const errorMsg = error.response?.data?.message;
        
        if (errorMsg?.includes('expired')) {
          setMessage('This verification link has expired. Please request a new one.');
        } else if (errorMsg?.includes('Invalid')) {
          setMessage('This verification link is invalid or has already been used. Please request a new one if needed.');
        } else {
          setMessage(
            errorMsg || 
            'Verification failed. The link may be invalid or expired.'
          );
        }
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <Loader className="h-16 w-16 text-primary-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Verifying your email...
            </h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Email Verified!
            </h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting you to login page...
            </p>
            <Link to={ROUTES.LOGIN}>
              <Button variant="primary" fullWidth>
                Go to Login
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Verification Failed
            </h2>
            <p className="text-gray-600">{message}</p>
            <div className="space-y-2">
              <Link to={ROUTES.RESEND_VERIFICATION}>
                <Button variant="primary" fullWidth>
                  Resend Verification Email
                </Button>
              </Link>
              <Link to={ROUTES.LOGIN}>
                <Button variant="outline" fullWidth>
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
