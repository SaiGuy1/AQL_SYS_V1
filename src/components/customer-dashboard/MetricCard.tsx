
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | null;
  icon: React.ReactNode;
  className?: string;
}

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  className 
}: MetricCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm text-gray-500 font-medium">{title}</h3>
          {value === null ? (
            <Skeleton className="mt-2 h-8 w-20" />
          ) : (
            <div className="mt-2 text-xl font-bold">{value}</div>
          )}
        </div>
        {icon}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
