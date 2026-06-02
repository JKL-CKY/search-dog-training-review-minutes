import { CheckCircle, Clock, Mic, FileText, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: {
    label: '待处理',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: Clock,
  },
  audio_uploaded: {
    label: '音频已上传',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Mic,
  },
  transcribed: {
    label: '已转写',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: FileText,
  },
  analyzed: {
    label: '已分析',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  completed: {
    label: '已完成',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  error: {
    label: '处理失败',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertCircle,
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}
