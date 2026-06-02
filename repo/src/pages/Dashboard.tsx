import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { sessionsApi, dogsApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { 
  FileText, 
  Dog, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Clock,
  CheckCircle,
  Mic
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Dashboard() {
  const { data: sessions = [] } = useQuery('sessions', () => 
    sessionsApi.getAll().then(res => res.data)
  );
  
  const { data: dogs = [] } = useQuery('dogs', () => 
    dogsApi.getAll().then(res => res.data)
  );

  const stats = {
    total: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    transcribed: sessions.filter(s => s.status === 'transcribed').length,
    analyzed: sessions.filter(s => s.status === 'analyzed' || s.status === 'completed').length,
  };

  const recentSessions = sessions.slice(0, 5);

  const statCards = [
    { label: '总训练次数', value: stats.total, icon: FileText, color: 'bg-blue-500' },
    { label: '待处理', value: stats.pending, icon: Clock, color: 'bg-yellow-500' },
    { label: '已转写', value: stats.transcribed, icon: Mic, color: 'bg-purple-500' },
    { label: '已完成分析', value: stats.analyzed, icon: CheckCircle, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">最近训练记录</h3>
            <Link
              to="/sessions"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {recentSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无训练记录</p>
              <Link
                to="/sessions/new"
                className="inline-block mt-3 text-primary-600 hover:text-primary-700 font-medium"
              >
                创建第一条训练记录 →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="block p-4 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{session.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(session.date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      </p>
                      {session.location && (
                        <p className="text-sm text-gray-400 mt-0.5">{session.location}</p>
                      )}
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                  {session.dog && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                        <Dog className="w-3.5 h-3.5 text-primary-600" />
                      </div>
                      <span className="text-sm text-gray-600">{session.dog.name}</span>
                      <span className="text-xs text-gray-400">({session.dog.breed})</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">犬只概览</h3>
            <div className="space-y-3">
              {dogs.slice(0, 4).map((dog) => (
                <div key={dog.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Dog className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{dog.name}</p>
                    <p className="text-xs text-gray-500">{dog.breed}</p>
                  </div>
                  {dog.training_level && (
                    <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                      {dog.training_level}
                    </span>
                  )}
                </div>
              ))}
              {dogs.length === 0 && (
                <div className="text-center py-6 text-gray-500 text-sm">
                  暂无犬只数据
                </div>
              )}
            </div>
            <Link
              to="/dogs"
              className="block w-full mt-4 text-center text-sm text-primary-600 hover:text-primary-700 py-2 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              管理全部犬只
            </Link>
          </div>

          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">快速操作</h3>
                <p className="text-xs text-primary-100">开始新的训练复盘</p>
              </div>
            </div>
            <Link
              to="/sessions/new"
              className="block w-full text-center py-2.5 bg-white text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors"
            >
              创建训练记录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
