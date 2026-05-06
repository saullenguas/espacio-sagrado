import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase/config';

function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim()) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Te hemos enviado un enlace de recuperación a tu correo. Revisa tu bandeja de entrada (y la de spam).');
      setEmail('');
    } catch (err) {
      console.error('Error al enviar correo de recuperación:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No encontramos una cuenta con ese correo. ¿Estás registrado?');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo no es válido.');
      } else {
        setError('Ocurrió un error. Inténtalo de nuevo más tarde.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sage-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-3xl font-semibold text-sage-800 text-center mb-2">
          Recupera tu acceso
        </h2>
        <p className="text-sage-600 text-center mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-sage-700">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="mt-1 block w-full px-4 py-2 border border-sage-300 rounded-xl shadow-sm focus:ring-2 focus:ring-sage-400 focus:border-sage-400 transition"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          {message && (
            <p className="text-green-600 text-sm text-center">{message}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 px-6 bg-sage-600 text-white font-semibold rounded-xl hover:bg-sage-700 transition"
          >
            Enviar enlace de recuperación
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-sage-500">
          <Link to="/login" className="text-sage-700 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;