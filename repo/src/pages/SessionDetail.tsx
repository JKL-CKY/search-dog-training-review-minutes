import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { sessionsApi, audioApi, analysisApi, emailApi } from '../api';
import SearchMap from '../components/SearchMap';
import StatusBadge from '../components/StatusBadge';
import { 
  Mic,
  FileText,
  Brain,
  Mail,
  Download,
  Play,
  MapPin,
  Calendar,
  Dog,
  Users,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import type { EmailSendRequest } from '../types';

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'audio' | 'analysis' | 'email'>('overview');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [includeTranscription, setIncludeTranscription] = useState(false);

  const { data: session, isLoading } = useQuery(
    ['session', id],
    () => sessionsApi.getById(Number(id)).then(res => res.data),
    { enabled: !!id }
  );

  const processAudioMutation = useMutation(
    () => audioApi.process(Number(id), true, true),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['session', id]);
      },
    }
  );

  const analyzeMutation = useMutation(
    () => analysisApi.analyze(Number(id)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['session', id]);
      },
    }
  );

  const sendEmailMutation = useMutation(
    (data: EmailSendRequest) => emailApi.sendReport(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['session', id]);
        setEmailRecipients('');
      },
    }
  );

  const uploadAudioMutation = useMutation(
    (file: File) => sessionsApi.uploadAudio(Number(id), file),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['session', id]);
      },
    }
  );

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAudioMutation.mutate(file);
    }
  };

  const handleSendEmail = () => {
    const recipients = emailRecipients.split(',').map(r => r.trim()).filter(r => r);
    if (recipients.length > 0 && session) {
      sendEmailMutation.mutate({
        session_id: session.id,
        recipients,
        include_improvement_plan: true,
        include_transcription: includeTranscription,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">训练记录不存在</p>
        <button
          onClick={() => navigate('/sessions')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          返回列表
        </button>
      </div>
    );
  }

  const center: [number, number] = session.latitude && session.longitude
    ? [session.latitude, session.longitude]
    : [39.9042, 116.4074];

  const radarData = session.evaluation_scores
    ? Object.entries(session.evaluation_scores).map(([name, data]) => ({
        subject: name,
        score: typeof data === 'object' ? data.score : data,
        fullMark: 10,
      }))
    : [];

  const tabs = [
    { id: 'overview', label: '概览', icon: FileText },
    { id: 'audio', label: '音频处理', icon: Mic },
    { id: 'analysis', label: 'AI分析', icon: Brain },
    { id: 'email', label: '邮件推送', icon: Mail },
  ];

  const getStepStatus = (step: number) => {
    const statusOrder = ['pending', 'audio_uploaded', 'transcribed', 'analyzed', 'completed'];
    const currentStep = statusOrder.indexOf(session.status);
    if (step < currentStep) return 'done';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  const steps = [
    { label: '创建记录', status: getStepStatus(0) },
    { label: '上传音频', status: getStepStatus(1) },
    { label: '语音转写', status: getStepStatus(2) },
    { label: 'AI分析', status: getStepStatus(3) },
    { label: '完成', status: getStepStatus(4) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sessions')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{session.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(new Date(session.date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
            </span>
            {session.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {session.location}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={session.status} />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    step.status === 'done'
                      ? 'bg-green-500 text-white'
                      : step.status === 'current'
                      ? 'bg-primary-500 text-white animate-pulse-glow'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="mt-2 text-xs text-gray-600 text-center">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step.status === 'done' ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100 px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'text-primary-600 border-primary-500'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">搜索路径与气味热点</h3>
                  <SearchMap
                    center={center}
                    searchPath={session.search_path}
                    scent_hotspots={session.scent_hotspots}
                    height="400px"
                  />
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">基本信息</h4>
                    <div className="space-y-2 text-sm">
                      {session.dog && (
                        <div className="flex items-center gap-2">
                          <Dog className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {session.dog.name} ({session.dog.breed})
                          </span>
                        </div>
                      )}
                      {session.handler && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{session.handler.name}</span>
                        </div>
                      )}
                      {session.scenario_type && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">场景类型:</span>
                          <span className="font-medium">{session.scenario_type}</span>
                        </div>
                      )}
                      {session.difficulty_level && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">难度等级:</span>
                          <span className="font-medium">{session.difficulty_level}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {session.description && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">训练描述</h4>
                      <p className="text-sm text-gray-600">{session.description}</p>
                    </div>
                  )}

                  {session.meeting_notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-2">会议笔记</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{session.meeting_notes}</p>
                    </div>
                  )}

                  {radarData.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 mb-4">能力雷达图</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
                            <Radar
                              name="评分"
                              dataKey="score"
                              stroke="#2563eb"
                              fill="#2563eb"
                              fillOpacity={0.3}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {session.scent_hotspots && session.scent_hotspots.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">气味热点详情</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {session.scent_hotspots.map((hotspot) => (
                      <div key={hotspot.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{hotspot.type}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              hotspot.intensity >= 0.8
                                ? 'bg-red-100 text-red-700'
                                : hotspot.intensity >= 0.5
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {(hotspot.intensity * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">半径: {hotspot.radius}m</p>
                        {hotspot.notes && (
                          <p className="text-xs text-gray-500 mt-1">{hotspot.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="space-y-6">
              {!session.audio_recording_path ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                  <Mic className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">上传音频文件</h3>
                  <p className="text-gray-500 mb-6">上传训练复盘会议的录音文件进行处理</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5" />
                    选择音频文件
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadAudioMutation.isLoading && (
                    <p className="mt-4 text-primary-600 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      上传中...
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <Play className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">音频文件已上传</h4>
                          <p className="text-sm text-gray-500">文件路径: {session.audio_recording_path}</p>
                        </div>
                      </div>
                      <label className="text-sm text-primary-600 hover:text-primary-700 cursor-pointer">
                        重新上传
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => processAudioMutation.mutate()}
                      disabled={processAudioMutation.isLoading || session.status === 'transcribed' || session.status === 'analyzed'}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {processAudioMutation.isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          处理中...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          开始音频处理
                        </>
                      )}
                    </button>
                    <p className="text-sm text-gray-500">
                      包括噪音抑制、语音转写和说话人识别
                    </p>
                  </div>

                  {processAudioMutation.error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                      <AlertCircle className="w-5 h-5 inline mr-2" />
                      音频处理失败，请重试
                    </div>
                  )}

                  {session.transcription && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-800">会议转录</h4>
                      </div>
                      <div className="p-4 max-h-96 overflow-y-auto custom-scrollbar">
                        <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                          {session.transcription}
                        </div>
                      </div>
                    </div>
                  )}

                  {session.speaker_diarization && session.speaker_diarization.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-medium text-gray-800">说话人识别</h4>
                      </div>
                      <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto custom-scrollbar">
                        {session.speaker_diarization.map((seg, index) => (
                          <div key={index} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                                {seg.speaker}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(seg.start * 1000), 'mm:ss')} - {format(new Date(seg.end * 1000), 'mm:ss')}
                              </span>
                            </div>
                            {seg.text && (
                              <p className="mt-2 text-sm text-gray-600">{seg.text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {session.status === 'pending' || session.status === 'audio_uploaded' ? (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">请先完成音频处理</h3>
                  <p className="text-gray-500">在"音频处理"标签页上传并处理音频后，才能进行AI分析</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => analyzeMutation.mutate()}
                      disabled={analyzeMutation.isLoading || session.status === 'analyzed' || session.status === 'completed'}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {analyzeMutation.isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        <>
                          <Brain className="w-5 h-5" />
                          开始AI分析
                        </>
                      )}
                    </button>
                    <p className="text-sm text-gray-500">
                      基于转录内容分析犬只表现并生成改进方案
                    </p>
                  </div>

                  {session.evaluation_scores && Object.keys(session.evaluation_scores).length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-4">评估结果</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(session.evaluation_scores).map(([name, data]) => (
                          <div key={name} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-700">{name}</span>
                              <span className="text-lg font-bold text-primary-600">
                                {typeof data === 'object' ? data.score : data}/10
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div
                                className="bg-primary-500 h-2 rounded-full transition-all"
                                style={{ width: `${(typeof data === 'object' ? data.score : data) * 10}%` }}
                              />
                            </div>
                            {typeof data === 'object' && data.notes && (
                              <p className="text-xs text-gray-500">{data.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {session.improvement_plan && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3">
                        <h4 className="font-medium text-white">训练改进方案</h4>
                      </div>
                      <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed font-sans">
                            {session.improvement_plan}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6 max-w-2xl">
              {session.status !== 'analyzed' && session.status !== 'completed' ? (
                <div className="text-center py-12">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">请先完成AI分析</h3>
                  <p className="text-gray-500">在"AI分析"标签页完成分析后，才能发送训练报告邮件</p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">发送训练报告</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          收件人（多个地址用逗号分隔）
                        </label>
                        <input
                          type="text"
                          value={emailRecipients}
                          onChange={(e) => setEmailRecipients(e.target.value)}
                          placeholder="example1@email.com, example2@email.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="includeTranscription"
                          checked={includeTranscription}
                          onChange={(e) => setIncludeTranscription(e.target.checked)}
                          className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="includeTranscription" className="text-sm text-gray-700">
                          包含完整转录文本
                        </label>
                      </div>
                      <button
                        onClick={handleSendEmail}
                        disabled={!emailRecipients.trim() || sendEmailMutation.isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {sendEmailMutation.isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            发送中...
                          </>
                        ) : (
                          <>
                            <Mail className="w-5 h-5" />
                            发送报告邮件
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {sendEmailMutation.isSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                      <CheckCircle2 className="w-5 h-5 inline mr-2" />
                      邮件发送成功！已发送给 {sendEmailMutation.data.data.sent_count} 位收件人
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-700 mb-3">邮件预览</h4>
                    <div className="bg-white rounded border border-gray-200 p-4 text-sm">
                      <p className="text-gray-500 mb-2">
                        <strong>主题:</strong> 【训练报告】{session.dog?.name || '搜救犬'} - {session.title}
                      </p>
                      <p className="text-gray-500 mb-4">
                        <strong>内容:</strong> 包含训练基本信息、犬只信息、评估成绩和个性化训练改进方案
                      </p>
                      {session.improvement_plan && (
                        <div className="bg-gray-50 rounded p-3 text-xs text-gray-600 max-h-48 overflow-y-auto">
                          <pre className="whitespace-pre-wrap">{session.improvement_plan.slice(0, 500)}...</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Upload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}
