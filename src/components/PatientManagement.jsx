import { useState } from 'react';
import { usePatients } from '../context/PatientContext';
import { useAuth } from '../context/AuthContext';

export default function PatientManagement() {
  const { patients, addPatient, updatePatient, deletePatient, searchPatients, getStats } = usePatients();
  const { currentUser } = useAuth();
  const [view, setView] = useState('list'); // 'list', 'add', 'edit', 'detail'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const stats = getStats();

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = searchQuery === '' || 
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const handleAddPatient = (patientData) => {
    addPatient(patientData);
    setShowForm(false);
  };

  const handleEditPatient = (patientData) => {
    updatePatient(selectedPatient.id, patientData);
    setSelectedPatient(null);
    setView('list');
  };

  const handleDeletePatient = (patientId) => {
    if (window.confirm('Yakin ingin menghapus data pasien ini?')) {
      deletePatient(patientId);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aktif': return 'bg-red-100 text-red-800';
      case 'Pengobatan': return 'bg-yellow-100 text-yellow-800';
      case 'Sembuh': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (view === 'add' || view === 'edit') {
    return (
      <PatientForm
        patient={selectedPatient}
        onSubmit={view === 'add' ? handleAddPatient : handleEditPatient}
        onCancel={() => {
          setView('list');
          setSelectedPatient(null);
          setShowForm(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Manajemen Data Pasien TBC
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">
              Logged in as: <span className="font-medium">{currentUser?.fullName}</span>
            </div>
            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {currentUser?.role}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-700">Total Pasien</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.aktif}</div>
            <div className="text-sm text-red-700">Aktif</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.pengobatan}</div>
            <div className="text-sm text-yellow-700">Pengobatan</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.sehat}</div>
            <div className="text-sm text-green-700">Sembuh</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.recentlyAdded}</div>
            <div className="text-sm text-purple-700">Minggu Ini</div>
          </div>
        </div>

        {/* Action Buttons */}
        {(currentUser?.role === 'kader' || currentUser?.role === 'admin') && (
          <button
            onClick={() => setView('add')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Tambah Pasien Baru
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, ID, atau alamat..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Pengobatan">Pengobatan</option>
              <option value="Sembuh">Sembuh</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h4 className="font-semibold text-gray-800">
            Daftar Pasien ({filteredPatients.length})
          </h4>
        </div>
        
        {filteredPatients.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📋</div>
            <p>Tidak ada data pasien yang ditemukan</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <div key={patient.id} className="p-6 hover:bg-gray-50 transition duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="font-medium text-gray-800">{patient.name}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>ID:</strong> {patient.id}</p>
                      <p><strong>Usia:</strong> {patient.age} tahun • <strong>Gender:</strong> {patient.gender}</p>
                      <p><strong>Alamat:</strong> {patient.address}</p>
                      <p><strong>Tanggal Diagnosis:</strong> {new Date(patient.diagnosisDate).toLocaleDateString('id-ID')}</p>
                      <p><strong>Keterangan:</strong> {patient.description}</p>
                      <p className="text-xs text-gray-500">
                        Dibuat: {new Date(patient.createdAt).toLocaleDateString('id-ID')} • 
                        Diperbarui: {new Date(patient.updatedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedPatient(patient);
                        setView('detail');
                      }}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition duration-200 text-sm"
                    >
                      Detail
                    </button>
                    {(currentUser?.role === 'kader' || currentUser?.role === 'admin') && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setView('edit');
                          }}
                          className="px-3 py-1 text-green-600 hover:bg-green-50 rounded transition duration-200 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePatient(patient.id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition duration-200 text-sm"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Patient Form Component
function PatientForm({ patient, onSubmit, onCancel }) {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState(patient ? {
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    address: patient.address,
    diagnosisDate: patient.diagnosisDate,
    status: patient.status,
    description: patient.description
  } : {
    name: '',
    age: '',
    gender: 'Laki-laki',
    address: '',
    diagnosisDate: new Date().toISOString().split('T')[0],
    status: 'Aktif',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      age: parseInt(formData.age),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-800">
          {patient ? 'Edit Data Pasien' : 'Tambah Pasien Baru'}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Pasien *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usia *
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              max="120"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="Aktif">Aktif</option>
              <option value="Pengobatan">Pengobatan</option>
              <option value="Sembuh">Sembuh</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanggal Diagnosis *
            </label>
            <input
              type="date"
              value={formData.diagnosisDate}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosisDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alamat *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Keterangan & Gejala *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="3"
            placeholder="Deskripsi gejala, hasil pemeriksaan, kondisi pasien..."
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            {patient ? 'Update' : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  );
}