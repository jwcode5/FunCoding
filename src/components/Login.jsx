import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      setError('Failed to ' + (isRegistering ? 'create an account' : 'sign in') + '. ' + err.message);
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Google. ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">{isRegistering ? 'Create an Account' : 'Welcome Back'}</h2>
        {error && <div className="error-alert">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <button disabled={loading} type="submit" className="primary-btn full-width">
            {isRegistering ? 'Sign Up' : 'Log In'}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>
        
        <button disabled={loading} onClick={handleGoogleLogin} className="google-btn full-width">
          Sign in with Google
        </button>

        <div className="login-footer">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button 
            type="button" 
            className="link-btn" 
            onClick={() => setIsRegistering(!isRegistering)}
          >
            {isRegistering ? 'Log In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
