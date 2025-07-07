import React, { useState, useEffect } from 'react';
import { Search, MapPin, Mail, Clock, Globe, FileText, Shield, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { vaspAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import VaspComments from '../comments/VaspComments';
import VaspSubmissionModal from './VaspSubmissionModal';
import VaspResponseStats from './VaspResponseStats';

const VASPCard = ({ vasp, onSelect }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{vasp.name}</h3>
          <p className="text-sm text-gray-600 truncate">{vasp.legal_name}</p>
        </div>
        <div className="flex items-center space-x-1 ml-4">
          <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500 truncate">{vasp.jurisdiction}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {vasp.compliance_email && (
          <div className="flex items-center space-x-2">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate">{vasp.compliance_email}</span>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600">{vasp.processing_time}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 capitalize">
            Method: {vasp.preferred_method}
          </span>
        </div>
        {vasp.required_document && (
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600">Required: {vasp.required_document}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {vasp.info_types && vasp.info_types.slice(0, 3).map((type, index) => (
          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {type}
          </span>
        ))}
        {vasp.info_types && vasp.info_types.length > 3 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            +{vasp.info_types.length - 3} more
          </span>
        )}
      </div>
      
      {/* VASP Response Statistics */}
      <VaspResponseStats vaspId={vasp.id} displayMode="badge" />

      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {vasp.accepts_us_service && (
            <span className="inline-flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              US Service
            </span>
          )}
          {vasp.has_own_portal && (
            <span className="inline-flex items-center text-xs text-blue-600">
              <Globe className="h-3 w-3 mr-1" />
              Portal
            </span>
          )}
          {vasp.preferred_method === 'kodex' && (
            <span className="inline-flex items-center text-xs text-purple-600">
              <Shield className="h-3 w-3 mr-1" />
              Kodex
            </span>
          )}
        </div>
        <button
          onClick={() => onSelect(vasp)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          Select VASP
        </button>
      </div>

      {vasp.notes && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 line-clamp-2">{vasp.notes}</p>
        </div>
      )}
      
      {/* Comments Section */}
      <VaspComments vaspId={vasp.id} vaspName={vasp.name} />
    </div>
  );
};

const VASPSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jurisdiction: '',
    preferred_method: '',
    accepts_us_service: ''
  });
  const [vaspData, setVaspData] = useState([]);
  const [filteredVASPs, setFilteredVASPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadVASPs();
  }, []);

  const loadVASPs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vaspAPI.getVASPs();
      setVaspData(data);
      setFilteredVASPs(data);
    } catch (err) {
      console.error('Failed to load VASPs:', err);
      setError('Failed to load VASP data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vaspData.length === 0) return;

    let filtered = vaspData.filter(vasp => {
      const matchesQuery = searchQuery === '' || 
        vasp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vasp.legal_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vasp.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (vasp.compliance_email && vasp.compliance_email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        if (key === 'accepts_us_service') {
          return vasp[key] === (value === 'true');
        }
        return vasp[key] === value;
      });

      return matchesQuery && matchesFilters;
    });

    setFilteredVASPs(filtered);
  }, [searchQuery, filters, vaspData]);

  const handleVASPSelect = (vasp) => {
    // Store selected VASP in sessionStorage
    sessionStorage.setItem('selectedVASP', JSON.stringify(vasp));
    navigate('/documents/new');
  };

  // Get unique values for filter options
  const uniqueJurisdictions = [...new Set(vaspData.map(v => v.jurisdiction))].filter(Boolean).sort();
  const uniqueMethods = [...new Set(vaspData.map(v => v.preferred_method))].filter(Boolean).sort();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading VASP database...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={loadVASPs}
                className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
              >
                Try again →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VASP Database Search</h1>
              <p className="mt-1 text-sm text-gray-600">
                Search and filter through {vaspData.length} Virtual Asset Service Providers for legal process
              </p>
            </div>
            <button
              onClick={() => setShowSubmissionModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Submit New VASP
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search VASPs
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, legal name, jurisdiction, or email..."
                  className="pl-10 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jurisdiction
              </label>
              <select
                value={filters.jurisdiction}
                onChange={(e) => setFilters({...filters, jurisdiction: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Jurisdictions</option>
                {uniqueJurisdictions.map(jurisdiction => (
                  <option key={jurisdiction} value={jurisdiction}>{jurisdiction}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Method
              </label>
              <select
                value={filters.preferred_method}
                onChange={(e) => setFilters({...filters, preferred_method: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Methods</option>
                {uniqueMethods.map(method => (
                  <option key={method} value={method}>{method.charAt(0).toUpperCase() + method.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                US Service
              </label>
              <select
                value={filters.accepts_us_service}
                onChange={(e) => setFilters({...filters, accepts_us_service: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All</option>
                <option value="true">Accepts US Service</option>
                <option value="false">No US Service</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredVASPs.length} of {vaspData.length} VASPs
            </p>
            {(searchQuery || Object.values(filters).some(v => v)) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({ jurisdiction: '', preferred_method: '', accepts_us_service: '' });
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVASPs.map((vasp) => (
            <VASPCard key={vasp.id} vasp={vasp} onSelect={handleVASPSelect} />
          ))}
        </div>

        {filteredVASPs.length === 0 && !loading && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No VASPs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        )}
      </div>
      
      {/* VASP Submission Modal */}
      <VaspSubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        onSuccess={() => {
          setShowSubmissionModal(false);
          loadVASPs(); // Reload the VASP list after successful submission
        }}
      />
    </div>
  );
};

export default VASPSearch;