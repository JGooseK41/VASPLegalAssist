import React, { useState, useEffect } from 'react';
import { Search, MapPin, Mail, Clock, Globe, FileText, Shield, CheckCircle, AlertCircle, Plus, ArrowLeft, ExternalLink, Copy } from 'lucide-react';
import { vaspAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import VaspComments from '../comments/VaspComments';
import VaspSubmissionModal from './VaspSubmissionModal';
import VaspResponseStats from './VaspResponseStats';
import EmailUpdateSuggestion from './EmailUpdateSuggestion';
import DirectContactDisplay from './DirectContactDisplay';
import VaspRequestTypeInfo from './VaspRequestTypeInfo';
import LEOFriendlyScore from './LEOFriendlyScore';
import { extractDbaFromNames } from '../../utils/parseVaspNames';
import ServiceTypeModal from './ServiceTypeModal';
import VaspUpdateModal from './VaspUpdateModal';
import { SERVICE_TYPE_DEFINITIONS, getServiceTypeColorClasses } from '../../constants/serviceTypeDefinitions';

const VASPCard = ({ vasp, onSelect }) => {
  const { legalName, dba } = extractDbaFromNames(vasp.name, vasp.legal_name);
  const [stats, setStats] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showServiceTypeModal, setShowServiceTypeModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg hover:shadow-xl transition-all duration-200 border-2 border-gray-300 hover:border-blue-400 overflow-hidden" data-tour="vasp-card">
      {/* Header Section - More prominent with color */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 truncate">{legalName}</h3>
            {dba && (
              <p className="text-sm text-gray-700 truncate mt-1">
                <span className="text-gray-600">DBA:</span> <span className="font-medium">{dba}</span>
              </p>
            )}
            
            {/* Service Type Badges - Moved under title */}
            {vasp.service_types && vasp.service_types.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {vasp.service_types.map((type) => {
                  const config = SERVICE_TYPE_DEFINITIONS[type];
                  if (!config) return null;
                  
                  return (
                    <div key={type} className="relative group">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getServiceTypeColorClasses(config.color)} cursor-help transition-all hover:shadow-md`}
                      >
                        {config.label}
                      </span>
                      
                      {/* Hover tooltip */}
                      <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded-lg py-2 px-3 bottom-full left-1/2 transform -translate-x-1/2 mb-1 whitespace-nowrap max-w-xs">
                        <div className="font-semibold mb-1">{config.fullName}</div>
                        <div className="text-gray-300">{config.shortDescription}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Info button for full details */}
                <button
                  onClick={() => setShowServiceTypeModal(true)}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  title="View all service type details"
                >
                  <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>View Details</span>
                </button>
              </div>
            )}
          </div>
          <span className="text-sm text-gray-600 flex items-center ml-3 bg-white px-2 py-1 rounded-full shadow-sm">
            <MapPin className="h-3 w-3 mr-1 text-gray-500" />
            {vasp.jurisdiction}
          </span>
        </div>
      </div>

      {/* Key Info Section */}
      <div className="p-4 space-y-3">
        {/* Essential Contact Info - More Prominent */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
          {vasp.compliance_email && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Compliance Email</p>
                  <p className="text-base font-semibold text-gray-900 select-all">{vasp.compliance_email}</p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(vasp.compliance_email)}
                className="ml-2 p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                title="Copy email address"
              >
                {copiedEmail ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
          {vasp.service_address && (
            <div className="flex items-start">
              <MapPin className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1">Service Address</p>
                <p className="text-base font-medium text-gray-900">{vasp.service_address}</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Preferred service method: {' '}
              {vasp.preferred_method === 'kodex' ? (
                <a 
                  href="https://app.kodexglobal.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700 inline-flex items-center"
                >
                  Kodex Portal
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              ) : vasp.has_own_portal && vasp.law_enforcement_url ? (
                <a 
                  href={vasp.law_enforcement_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700 inline-flex items-center"
                >
                  Portal
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              ) : (
                <span className="font-medium capitalize">{vasp.preferred_method}</span>
              )}
            </span>
          </div>
        </div>

        {/* Request Type Tabs - Keep these prominent */}
        <VaspRequestTypeInfo vasp={vasp} stats={stats} />
        
        {/* LEO Friendly Score */}
        <div className="flex justify-end">
          <LEOFriendlyScore leoScore={stats?.leoScore} compact={true} />
        </div>

        {/* Collapsible Details Section */}
        {showDetails && (
          <div className="space-y-3 animate-fadeIn">
            {/* Data Types */}
            {vasp.info_types && vasp.info_types.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Available Data Types</p>
                <div className="flex flex-wrap gap-1">
                  {vasp.info_types.map((type, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Badge */}
            <VaspResponseStats 
              vaspId={vasp.id} 
              displayMode="badge" 
              onStatsLoaded={setStats}
            />

            {/* Direct Contacts */}
            {stats?.contactInfo?.directContacts && stats.contactInfo.directContacts.length > 0 && (
              <DirectContactDisplay contacts={stats.contactInfo.directContacts} />
            )}
          </div>
        )}

        {/* Email Update Alert - Only show when needed */}
        {stats?.contactInfo?.emailUpdatesSuggested && (
          <EmailUpdateSuggestion
            vaspId={vasp.id}
            currentEmail={vasp.compliance_email}
            suggestedEmails={stats.contactInfo.suggestedEmails}
            onSuccess={() => {
              window.location.reload();
            }}
          />
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUpdateModal(true)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Update Info
            </button>
            <button
              onClick={() => onSelect(vasp)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              data-tour="generate-request"
            >
              Generate Request
            </button>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors text-center"
          >
            {showDetails ? '▲ Less details' : '▼ More details'}
          </button>
        </div>
      </div>

      {/* Comments Section - Separated visually */}
      <div className="border-t border-gray-200">
        <VaspComments vaspId={vasp.id} vaspName={vasp.name} />
      </div>
      
      {/* Service Type Modal */}
      {showServiceTypeModal && (
        <ServiceTypeModal
          isOpen={showServiceTypeModal}
          onClose={() => setShowServiceTypeModal(false)}
          selectedTypes={vasp.service_types || []}
        />
      )}
      
      {/* Update Info Modal */}
      {showUpdateModal && (
        <VaspUpdateModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          vasp={vasp}
        />
      )}
    </div>
  );
};

const VASPSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jurisdiction: '',
    preferred_method: '',
    accepts_us_service: '',
    service_type: ''
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
        if (key === 'service_type') {
          return vasp.service_types && vasp.service_types.includes(value);
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
    navigate('/documents/simple');
  };

  // Get unique values for filter options
  const uniqueJurisdictions = [...new Set(vaspData.map(v => v.jurisdiction))].filter(Boolean).sort();
  const uniqueMethods = [...new Set(vaspData.map(v => v.preferred_method))].filter(Boolean).sort();
  const uniqueServiceTypes = [...new Set(vaspData.flatMap(v => v.service_types || []))].filter(Boolean).sort();

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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
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
              Add VASP to Database
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 border-2 border-gray-200">
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
                  data-tour="search-vasp"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type
              </label>
              <select
                value={filters.service_type}
                onChange={(e) => setFilters({...filters, service_type: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Service Types</option>
                {uniqueServiceTypes.map(type => {
                  const config = SERVICE_TYPE_DEFINITIONS[type];
                  return config ? (
                    <option key={type} value={type}>{config.label}</option>
                  ) : null;
                })}
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
                  setFilters({ jurisdiction: '', preferred_method: '', accepts_us_service: '', service_type: '' });
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    </div>
  );
};

export default VASPSearch;