// Dummy user data for demo purposes (tanpa backend auth)
export const USERS = [
  {
    id: "admin-001",
    username: "admin",
    password: "admin123",
    name: "Administrator",
    role: "admin",
    fullName: "Dr. Siti Admin",
    email: "admin@tbc-system.com",
    region: "Jakarta Pusat",
    permissions: [
      "view_all_data",
      "manage_users",
      "manage_patients",
      "view_reports",
      "manage_settings",
      "full_access"
    ]
  },
  {
    id: "viewer-001", 
    username: "viewer",
    password: "viewer123",
    name: "Viewer",
    role: "viewer",
    fullName: "Budi Viewer",
    email: "viewer@tbc-system.com",
    region: "Jakarta Selatan",
    permissions: [
      "view_all_data",
      "view_reports"
    ]
  },
  {
    id: "kader-001",
    username: "kader", 
    password: "kader123",
    name: "Kader",
    role: "kader",
    fullName: "Sari Kader",
    email: "kader@tbc-system.com",
    region: "Jakarta Timur",
    permissions: [
      "manage_patients",
      "add_patient_data",
      "view_own_data"
    ]
  },
  {
    id: "pelapor-001",
    username: "pelapor",
    password: "pelapor123", 
    name: "Pelapor",
    role: "pelapor",
    fullName: "Ahmad Pelapor",
    email: "pelapor@tbc-system.com",
    region: "Jakarta Barat",
    permissions: [
      "add_patient_data",
      "view_own_data"
    ]
  }
];

// Initial dummy patient data
export const DUMMY_PATIENTS = [
  {
    id: "TB-2024-001",
    name: "Pasien A",
    age: 45,
    gender: "Laki-laki",
    address: "Jl. Mawar No. 123, Jakarta Timur",
    diagnosisDate: "2024-01-15",
    status: "Aktif",
    kaderId: "kader-001",
    description: "Pasien dengan gejala batuk lebih dari 2 minggu, hasil BTA positif",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "TB-2024-002", 
    name: "Pasien B",
    age: 32,
    gender: "Perempuan",
    address: "Jl. Melati No. 45, Jakarta Selatan",
    diagnosisDate: "2024-01-20",
    status: "Pengobatan",
    kaderId: "kader-001",
    description: "Kontak erat pasien TBC positif, riwayat diabetes",
    createdAt: "2024-01-20T14:15:00Z",
    updatedAt: "2024-01-22T09:45:00Z"
  },
  {
    id: "TB-2024-003",
    name: "Pasien C", 
    age: 28,
    gender: "Laki-laki",
    address: "Jl. Kamboja No. 67, Jakarta Barat",
    diagnosisDate: "2024-02-01",
    status: "Aktif",
    pelaporId: "pelapor-001",
    description: "Pasien dengan penurunan berat badan dandemam berkepanjangan",
    createdAt: "2024-02-01T16:20:00Z",
    updatedAt: "2024-02-01T16:20:00Z"
  },
  {
    id: "TB-2024-004",
    name: "Pasien D",
    age: 55,
    gender: "Perempuan", 
    address: "Jl. Anggrek No. 89, Jakarta Pusat",
    diagnosisDate: "2024-02-05",
    status: "Sembuh",
    kaderId: "kader-001",
    description: "Pasien yang telah menyelesaikan masa pengobatan 6 bulan",
    createdAt: "2024-02-05T11:00:00Z",
    updatedAt: "2024-08-05T11:00:00Z"
  },
  {
    id: "TB-2024-005",
    name: "Pasien E",
    age: 38,
    gender: "Laki-laki",
    address: "Jl. Dahlia No. 12, Jakarta Utara", 
    diagnosisDate: "2024-02-10",
    status: "Aktif",
    pelaporId: "pelapor-001",
    description: "Pasien dengan HIV komorbid, memerlukan AT",
    createdAt: "2024-02-10T13:45:00Z",
    updatedAt: "2024-02-12T08:30:00Z"
  }
];

// Helper functions
export const getUserByCredentials = (username, password) => {
  return USERS.find(user => user.username === username && user.password === password);
};

export const getUserById = (id) => {
  return USERS.find(user => user.id === id);
};

export const hasPermission = (user, permission) => {
  return user?.permissions?.includes(permission) || user?.permissions?.includes("full_access");
};