import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { sessionsApi, dogsApi, handlersApi } from '../api';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft,
  Save,
  MapPin,
  Dog,
  Users,
  Calendar,
  FileText,
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';
import type { TrainingSession, SearchPathPoint, ScentHotspot } from '../types';

interface FormData {
  title: string;
  description: string;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  dog_id: number;
  handler_id: number;
  scenario_type: string;
  difficulty_level: string;
  meeting_notes: string;
}

export default function SessionCreate() {
  const navigate = useNavigate();
  const [searchPath, setSearchPath] = useState<SearchPathPoint[]>([]);
  const [scentHotspots, setScentHotspots] = useState<ScentHotspot[]>([]);
  const [newPathPoint, setNewPathPoint] = useState({ lat: '', lng: '' });
  const [newHotspot, setNewHotspot] = useState({ lat: '', lng: '', intensity: 0.8, type: '', radius: 10 });

  const { data: dogs = [] } = useQuery('dogs', () => 
    dogsApi.getAll().then(res => res.data)
  );
  
  const { data: handlers = [] } = useQuery('handlers', () => 
    handlersApi.getAll().then(res => res.data)
  );

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      difficulty_level: '中等',
      scenario_type: '建筑物搜救',
    },
  });

  const createMutation = useMutation(
    (data: Partial<TrainingSession>) => sessionsApi.create(data),
    {
      onSuccess: (response) => {
        navigate(`/sessions/${response.data.id}`);
      },
    }
  );

  const onSubmit = (data: FormData) => {
    const sessionData: Partial<TrainingSession> = {
      ...data,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      search_path: searchPath,
      scent_hotspots: scentHotspots,
      status: 'pending',
    };
    createMutation.mutate(sessionData);
  };

  const addPathPoint = () => {
    if (newPathPoint.lat && newPathPoint.lng) {
      setSearchPath([
        ...searchPath,
        {
          lat: parseFloat(newPathPoint.lat),
          lng: parseFloat(newPathPoint.lng),
          timestamp: new Date().toISOString(),
        },
      ]);
      setNewPathPoint({ lat: '', lng: '' });
    }
  };

  const removePathPoint = (index: number) => {
    setSearchPath(searchPath.filter((_, i) => i !== index));
  };

  const addHotspot = () => {
    if (newHotspot.lat && newHotspot.lng && newHotspot.type) {
      setScentHotspots([
        ...scentHotspots,
        {
          id: Date.now().toString(),
          lat: parseFloat(newHotspot.lat),
          lng: parseFloat(newHotspot.lng),
          intensity: newHotspot.intensity,
          type: newHotspot.type,
          radius: newHotspot.radius,
          detected_at: new Date().toISOString(),
        },
      ]);
      setNewHotspot({ lat: '', lng: '', intensity: 0.8, type: '', radius: 10 });
    }
  };

  const removeHotspot = (id: string) => {
    setScentHotspots(scentHotspots.filter((h) => h.id !== id));
  };

  const scenarioTypes = ['建筑物搜救', '废墟搜救', '山林搜救', '水域搜救', '气味追踪', '服从性训练', '综合演练'];
  const difficultyLevels = ['简单', '中等', '困难', '专家级'];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/sessions')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">创建训练记录</h1>
          <p className="text-gray-500">录入新的搜救犬训练复盘信息</p>
        </div>
      </div>

      {createMutation.isError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          创建失败，请重试
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            基本信息
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">训练标题 *</label>
              <input
                type="text"
                {...register('title', { required: '请输入训练标题' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如：废墟环境搜救训练复盘"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">训练描述</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                placeholder="描述训练的目的、场景和主要内容..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                训练时间 *
              </label>
              <input
                type="datetime-local"
                {...register('date', { required: '请选择训练时间' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                训练地点 *
              </label>
              <input
                type="text"
                {...register('location', { required: '请输入训练地点' })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如：XX训练基地废墟场"
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-500">{errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">纬度</label>
              <input
                type="number"
                step="any"
                {...register('latitude')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如：39.9042"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">经度</label>
              <input
                type="number"
                step="any"
                {...register('longitude')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="例如：116.4074"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Dog className="w-4 h-4 text-gray-400" />
                搜救犬
              </label>
              <select
                {...register('dog_id')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">请选择搜救犬</option>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name} ({dog.breed})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                训导员
              </label>
              <select
                {...register('handler_id')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                <option value="">请选择训导员</option>
                {handlers.map((handler) => (
                  <option key={handler.id} value={handler.id}>
                    {handler.name} - {handler.rank || '训导员'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">场景类型</label>
              <select
                {...register('scenario_type')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                {scenarioTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">难度等级</label>
              <select
                {...register('difficulty_level')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                {difficultyLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">搜索路径</h2>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="number"
              step="any"
              placeholder="纬度"
              value={newPathPoint.lat}
              onChange={(e) => setNewPathPoint({ ...newPathPoint, lat: e.target.value })}
              className="flex-1 min-w-[150px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <input
              type="number"
              step="any"
              placeholder="经度"
              value={newPathPoint.lng}
              onChange={(e) => setNewPathPoint({ ...newPathPoint, lng: e.target.value })}
              className="flex-1 min-w-[150px] px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={addPathPoint}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              添加点
            </button>
          </div>

          {searchPath.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {searchPath.map((point, index) => (
                <div key={index} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">
                    #{index + 1}: {point.lat.toFixed(6)}, {point.lng.toFixed(6)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePathPoint(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">气味热点</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <input
              type="number"
              step="any"
              placeholder="纬度"
              value={newHotspot.lat}
              onChange={(e) => setNewHotspot({ ...newHotspot, lat: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <input
              type="number"
              step="any"
              placeholder="经度"
              value={newHotspot.lng}
              onChange={(e) => setNewHotspot({ ...newHotspot, lng: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <input
              type="text"
              placeholder="气味类型"
              value={newHotspot.type}
              onChange={(e) => setNewHotspot({ ...newHotspot, type: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <input
              type="number"
              step="0.1"
              min="0"
              max="1"
              placeholder="强度 0-1"
              value={newHotspot.intensity}
              onChange={(e) => setNewHotspot({ ...newHotspot, intensity: parseFloat(e.target.value) })}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={addHotspot}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 text-sm"
            >
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>

          {scentHotspots.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {scentHotspots.map((hotspot) => (
                <div key={hotspot.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        hotspot.intensity >= 0.8
                          ? 'bg-red-500'
                          : hotspot.intensity >= 0.5
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                    />
                    <span className="text-sm text-gray-600">
                      {hotspot.type} - {(hotspot.intensity * 100).toFixed(0)}%
                    </span>
                    <span className="text-xs text-gray-400">
                      ({hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHotspot(hotspot.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">会议笔记</h2>
          <textarea
            {...register('meeting_notes')}
            rows={6}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="记录复盘会议的要点、讨论内容和初步结论..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/sessions')}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={createMutation.isLoading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-5 h-5" />
            {createMutation.isLoading ? '保存中...' : '保存训练记录'}
          </button>
        </div>
      </form>
    </div>
  );
}
