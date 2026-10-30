import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { registerThunk } from '../../features/auth/authSlice';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const status = useSelector((state) => state.auth.status);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    const result = await dispatch(registerThunk(values));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Account created successfully!', 'success');
      navigate('/dashboard');
    } else {
      showToast(result.payload || 'Registration failed', 'error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-xl2 border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-2">
          <div className="rounded-lg bg-brand-600 p-2 text-white">
            <Layers size={20} />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Builder Platform</span>
        </div>
        <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Create your account</h2>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Start building client websites today.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name" placeholder="Jane Doe" error={errors.name?.message} {...register('name')} />
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
          <Input label="Password" type="password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
          <Button type="submit" className="w-full" loading={status === 'loading'}>
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
