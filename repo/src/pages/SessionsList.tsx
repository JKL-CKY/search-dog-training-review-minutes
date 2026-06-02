import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { sessionsApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Dog,
  MapPin,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useState } from 'react';

export default function SessionsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: sessions = [], isLoading } = useQuery('sessions', () => 
    sessionsApi.getAll().then(res => res.data)
  );

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'audio_uploaded', label: '音频已上传' },
    { value: 'transcribed', label: '已转写' },
    { value: 'analyzed', label: '已分析' },
    { value: 'completed', label: '已完成' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">训练记录</h2>
          <p className="text-gray-500 mt-1">管理所有搜救犬训练复盘记录</p>
        </div>
        <Link
          to="/sessions/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          创建训练记录
        </Link>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索训练记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无训练记录</h3>
          <p className="text-gray-500 mb-6">创建第一条训练记录开始管理搜救犬训练</p>
          <Link
            to="/sessions/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建训练记录
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <Link
              key={session.id}
              to={`/sessions/${session.id}`}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800 group-hover:text-primary-600 transition-colors line-clamp-1">
                  {session.title}
                </h3>
                <StatusBadge status={session.status} />
              </div>
              
              {session.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{session.description}</p>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{format(new Date(session.date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</span>
                </div>
                {session.location && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{session.location}</span>
                  </div>
                )}
                {session.dog && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Dog className="w-4 h-4 text-gray-400" />
                    <span>{session.dog.name} ({session.dog.breed})</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {session.scenario_type && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {session.scenario_type}
                    </span>
                  )}
                  {session.difficulty_level && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">
                      {session.difficulty_level}
                    </span>
                  )}
                </div>
                <span className="text-sm text-primary-600 group-hover:text-primary-700 font-medium">
                  查看详情 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
