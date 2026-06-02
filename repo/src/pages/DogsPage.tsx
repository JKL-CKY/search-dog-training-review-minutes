import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { dogsApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { 
  Dog,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  AlertCircle
} from 'lucide-react';
import type { Dog as DogType } from '../types';

export default function DogsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDog, setEditingDog] = useState<DogType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    gender: '',
    weight: '',
    training_level: '',
    specializations: '',
  });

  const { data: dogs = [], isLoading } = useQuery('dogs', () => 
    dogsApi.getAll().then(res => res.data)
  );

  const createMutation = useMutation(
    (data: Partial<DogType>) => dogsApi.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('dogs');
        closeModal();
      },
    }
  );

  const updateMutation = useMutation(
    (data: Partial<DogType> & { id: number }) => dogsApi.update(data.id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('dogs');
        closeModal();
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => dogsApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('dogs');
      },
    }
  );

  const filteredDogs = dogs.filter(dog =>
    dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dog.breed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (dog?: DogType) => {
    if (dog) {
      setEditingDog(dog);
      setFormData({
        name: dog.name,
        breed: dog.breed,
        age: dog.age?.toString() || '',
        gender: dog.gender || '',
        weight: dog.weight?.toString() || '',
        training_level: dog.training_level || '',
        specializations: dog.specializations?.join(', ') || '',
      });
    } else {
      setEditingDog(null);
      setFormData({
        name: '',
        breed: '',
        age: '',
        gender: '',
        weight: '',
        training_level: '',
        specializations: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDog(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dogData: Partial<DogType> = {
      name: formData.name,
      breed: formData.breed,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      training_level: formData.training_level || undefined,
      specializations: formData.specializations
        ? formData.specializations.split(',').map(s => s.trim()).filter(Boolean)
        : undefined,
    };

    if (editingDog) {
      updateMutation.mutate({ ...dogData, id: editingDog.id });
    } else {
      createMutation.mutate(dogData);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`确定要删除搜救犬 "${name}" 吗？`)) {
      deleteMutation.mutate(id);
    }
  };

  const trainingLevels = ['初级', '中级', '高级', '专家级', '退役'];
  const genders = ['公', '母'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">犬只管理</h2>
          <p className="text-gray-500 mt-1">管理搜救犬队伍信息</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          添加搜救犬
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索搜救犬名称或品种..."
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
      ) : filteredDogs.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <Dog className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无搜救犬数据</h3>
          <p className="text-gray-500 mb-6">添加第一只搜救犬开始管理</p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加搜救犬
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDogs.map((dog) => (
            <div
              key={dog.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-primary-200 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                    <Dog className="w-7 h-7 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{dog.name}</h3>
                    <p className="text-sm text-gray-500">{dog.breed}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openModal(dog)}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dog.id, dog.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">年龄</span>
                  <span className="text-gray-700">{dog.age ? `${dog.age} 岁` : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">性别</span>
                  <span className="text-gray-700">{dog.gender || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">体重</span>
                  <span className="text-gray-700">{dog.weight ? `${dog.weight} kg` : '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">训练等级</span>
                  {dog.training_level && (
                    <StatusBadge status="completed" />
                  )}
                  <span className="text-gray-700">{dog.training_level || '-'}</span>
                </div>
              </div>

              {dog.specializations && dog.specializations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">专长</p>
                  <div className="flex flex-wrap gap-1">
                    {dog.specializations.map((spec, index) => (
                      <span
                        key={index}
                        className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
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
                {editingDog ? '编辑搜救犬' : '添加搜救犬'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">犬名 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：雷霆"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品种 *</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：德国牧羊犬"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="岁"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    <option value="">请选择</option>
                    {genders.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">体重 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：35"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">训练等级</label>
                <select
                  value={formData.training_level}
                  onChange={(e) => setFormData({ ...formData, training_level: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                >
                  <option value="">请选择</option>
                  {trainingLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">专长（用逗号分隔）</label>
                <input
                  type="text"
                  value={formData.specializations}
                  onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="例如：废墟搜救, 气味追踪, 水域救援"
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
