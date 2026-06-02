import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { handlersApi } from '../api';
import { 
  Users,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  AlertCircle,
  Phone,
  Mail
} from 'lucide-react';
import type { Handler } from '../types';

export default function HandlersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHandler, setEditingHandler] = useState<Handler | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    team: '',
    phone: '',
    email: '',
    voice_profile_id: '',
  });

  const { data: handlers = [], isLoading } = useQuery('handlers', () => 
    handlersApi.getAll().then(res => res.data)
  );

  const createMutation = useMutation(
    (data: Partial<Handler>) => handlersApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('handlers');
        closeModal();
      },
    }
  );

  const updateMutation = useMutation(
    (data: Partial<Handler> & { id: number }) => handlersApi.update(data.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('handlers');
        closeModal();
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => handlersApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('handlers');
      },
    }
  );

  const filteredHandlers = handlers.filter(handler =>
    handler.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    handler.team?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (handler?: Handler) => {
    if (handler) {
      setEditingHandler(handler);
      setFormData({
        name: handler.name,
        rank: handler.rank || '',
        team: handler.team || '',
        phone: handler.contact_info?.phone || '',
        email: handler.contact_info?.email || '',
        voice_profile_id: handler.voice_profile_id || '',
      });
    } else {
      setEditingHandler(null);
      setFormData({
        name: '',
        rank: '',
        team: '',
        phone: '',
        email: '',
        voice_profile_id: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHandler(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const handlerData: Partial<Handler> = {
      name: formData.name,
      rank: formData.rank || undefined,
      team: formData.team || undefined,
      voice_profile_id: formData.voice_profile_id || undefined,
      contact_info: {
        phone: formData.phone || undefined,
        email: formData.email || undefined,
      },
    };

    if (editingHandler) {
      updateMutation.mutate({ ...handlerData, id: editingHandler.id });
    } else {
      createMutation.mutate(handlerData);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`确定要删除训导员 "${name}" 吗？`)) {
      deleteMutation.mutate(id);
    }
  };

  const ranks = ['训导员', '高级训导员', '总训导员', '队长', '副队长'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">训导员管理</h2>
          <p className="text-gray-500 mt-1">管理搜救犬训导员队伍信息</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          添加训导员
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索训导员姓名或队伍..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : filteredHandlers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无训导员数据</h3>
          <p className="text-gray-500 mb-6">添加第一位训导员开始管理</p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加训导员
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredHandlers.map((handler) => (
            <div
              key={handler.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-primary-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {handler.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{handler.name}</h3>
                    <p className="text-sm text-primary-600">{handler.rank || '训导员'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(handler)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(handler.id, handler.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {handler.team && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{handler.team}</span>
                  </div>
                )}
                {handler.contact_info?.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{handler.contact_info.phone}</span>
                  </div>
                )}
                {handler.contact_info?.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{handler.contact_info.email}</span>
                  </div>
                )}
              </div>

              {handler.voice_profile_id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">声纹档案</p>
                  <p className="text-sm text-gray-600 font-mono">{handler.voice_profile_id}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingHandler ? '编辑训导员' : '添加训导员'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入姓名"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">职级</label>
                  <select
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">请选择</option>
                    {ranks.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所属队伍</label>
                  <input
                    type="text"
                    value={formData.team}
                    onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="例如：第一救援队"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入联系电话"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电子邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="请输入电子邮箱"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">声纹档案ID</label>
                <input
                  type="text"
                  value={formData.voice_profile_id}
                  onChange={(e) => setFormData({ ...formData, voice_profile_id: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  placeholder="用于说话人识别的声纹档案ID"
                />
              </div>

              {(createMutation.isError || updateMutation.isError) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  保存失败，请重试
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {createMutation.isLoading || updateMutation.isLoading ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
