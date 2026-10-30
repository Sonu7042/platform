import { Construction } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';

export function ComingSoonPage({ feature, phase }) {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={Construction}
        title={`${feature} is not built yet`}
        description={`This area is scheduled for ${phase} of the development roadmap. The feature is intentionally disabled rather than faked.`}
      />
    </div>
  );
}
