import { createContext, useContext, useState, useEffect } from 'react';
import { DUMMY_PATIENTS } from '../data/users';
import { useAuth } from './AuthContext';

const PatientContext = createContext();

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};

export const PatientProvider = ({ children }) => {
  const [patients, setPatients] = useState(DUMMY_PATIENTS);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  // Load patients from localStorage on mount
  useEffect(() => {
    const savedPatients = localStorage.getItem('tbc_patients');
    if (savedPatients) {
      try {
        setPatients(JSON.parse(savedPatients));
      } catch (e) {
        console.error('Error loading patients from localStorage:', e);
      }
    }
  }, []);

  // Save patients to localStorage whenever patients change
  useEffect(() => {
    localStorage.setItem('tbc_patients', JSON.stringify(patients));
  }, [patients]);

  const addPatient = (patientData) => {
    const newPatient = {
      id: `TB-${new Date().getFullYear()}-${String(patients.length + 1).padStart(3, '0')}`,
      ...patientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      [currentUser.role === 'kader' ? 'kaderId' : 'pelaporId']: currentUser.id
    };
    
    setPatients(prev => [...prev, newPatient]);
    return newPatient;
  };

  const updatePatient = (id, updatedData) => {
    setPatients(prev => prev.map(patient => 
      patient.id === id 
        ? { ...patient, ...updatedData, updatedAt: new Date().toISOString() }
        : patient
    ));
  };

  const deletePatient = (id) => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
  };

  const getPatientById = (id) => {
    return patients.find(patient => patient.id === id);
  };

  const getPatientsByKader = (kaderId) => {
    return patients.filter(patient => patient.kaderId === kaderId);
  };

  const getPatientsByPelapor = (pelaporId) => {
    return patients.filter(patient => patient.pelaporId === pelaporId);
  };

  const getPatientsByStatus = (status) => {
    return patients.filter(patient => patient.status === status);
  };

  const searchPatients = (query) => {
    const lowercaseQuery = query.toLowerCase();
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(lowercaseQuery) ||
      patient.address.toLowerCase().includes(lowercaseQuery) ||
      patient.description.toLowerCase().includes(lowercaseQuery) ||
      patient.id.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Get patients visible to current user based on role
  const getVisiblePatients = () => {
    if (!currentUser) return [];
    
    switch (currentUser.role) {
      case 'admin':
        return patients; // Admin can see all
      case 'viewer':
        return patients; // Viewer can see all
      case 'kader':
        return getPatientsByKader(currentUser.id);
      case 'pelapor':
        return getPatientsByPelapor(currentUser.id);
      default:
        return [];
    }
  };

  // Get statistics for current user
  const getStats = () => {
    const visiblePatients = getVisiblePatients();
    const stats = {
      total: visiblePatients.length,
      aktif: visiblePatients.filter(p => p.status === 'Aktif').length,
      pengobatan: visiblePatients.filter(p => p.status === 'Pengobatan').length,
      sehat: visiblePatients.filter(p => p.status === 'Sembuh').length,
      recentlyAdded: visiblePatients.filter(p => {
        const createdDate = new Date(p.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length
    };
    return stats;
  };

  const value = {
    patients: getVisiblePatients(),
    allPatients: patients, // For admin to see all
    loading,
    addPatient,
    updatePatient,
    deletePatient,
    getPatientById,
    getPatientsByKader,
    getPatientsByPelapor,
    getPatientsByStatus,
    searchPatients,
    getVisiblePatients,
    getStats
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};