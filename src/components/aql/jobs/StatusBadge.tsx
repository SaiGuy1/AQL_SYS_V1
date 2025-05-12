
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Job } from "./types";
import { useTranslation } from '@/contexts/TranslationContext';

interface StatusBadgeProps {
  status: Job['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">{t('status_scheduled')}</Badge>;
    case 'in-progress':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">{t('status_in_progress')}</Badge>;
    case 'completed':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">{t('status_completed')}</Badge>;
    case 'on-hold':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">{t('status_on_hold')}</Badge>;
    case 'needs-review':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
        {status === 'needs-review' ? t('status_on_hold') : t(`status_${status}`)}
      </Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">{t('status_cancelled')}</Badge>;
    default:
      return null;
  }
};

export default StatusBadge;
