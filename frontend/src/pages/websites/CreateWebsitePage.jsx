import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { createWebsiteThunk } from '../../features/websites/websitesSlice';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';

const CATEGORIES = [
  'Corporate Business',
  'IT Company',
  'Digital Marketing Agency',
  'Restaurant',
  'Real Estate',
  'Portfolio',
  'School',
  'Hospital or Clinic',
  'E-commerce Catalog',
  'Construction Company',
  'Salon or Beauty Business',
  'Travel Agency',
];

const schema = z.object({
  name: z.string().min(2, 'Website name is required'),
  category: z.string().min(1, 'Select a category'),
  brandName: z.string().optional(),
  description: z.string().optional(),
});

export function CreateWebsitePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { category: CATEGORIES[0] } });

  const onSubmit = async (values) => {
    const result = await dispatch(createWebsiteThunk(values));
    if (result.meta.requestStatus === 'fulfilled') {
      showToast('Website project created', 'success');
      navigate(`/websites/${result.payload.id}`);
    } else {
      showToast(result.payload || 'Failed to create website', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/websites" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
        <ArrowLeft size={14} /> Back to My Websites
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create a New Website</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Step 1 of the setup — basic information. Template selection, page configuration, and the visual
          editor open automatically once the project is created.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Website name" placeholder="Acme Restaurant" error={errors.name?.message} {...register('name')} />
          <Select label="Category" error={errors.category?.message} {...register('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Input label="Brand name (optional)" placeholder="Acme" {...register('brandName')} />
          <TextArea
            label="Description (optional)"
            rows={4}
            placeholder="A short description of this website project..."
            {...register('description')}
          />
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Create Website Project
          </Button>
        </form>
      </Card>
    </div>
  );
}
