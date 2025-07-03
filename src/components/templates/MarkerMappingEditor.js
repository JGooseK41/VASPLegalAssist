import React, { useState, useEffect } from 'react';
import { Save, Eye, AlertCircle, CheckCircle, HelpCircle, X } from 'lucide-react';
import { templateAPI } from '../../services/api';

const MarkerMappingEditor = ({ template, onSave, onCancel }) => {
  const [mappings, setMappings] = useState({});
  const [availableMarkers, setAvailableMarkers] = useState([]);
  const [previewContent, setPreviewContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadAvailableMarkers();
    if (template.markerMappings) {
      try {
        setMappings(JSON.parse(template.markerMappings));
      } catch (e) {
        console.error('Failed to parse marker mappings:', e);
      }
    }
  }, [template]);

  const loadAvailableMarkers = async () => {
    try {
      const markers = await templateAPI.getAvailableMarkers();
      setAvailableMarkers(markers);
    } catch (err) {
      console.error('Failed to load markers:', err);
    }
  };

  const handleMappingChange = (marker, field) => {
    setMappings({
      ...mappings,
      [marker]: field
    });
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await templateAPI.previewTemplate(template.id, {
        // You can customize these preview values
        agencyName: 'U.S. Department of Justice',
        investigatorName: 'John Doe',
        investigatorTitle: 'Special Agent'
      });
      
      setPreviewContent(response.preview);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview error:', err);
      setError('Failed to generate preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await templateAPI.updateMarkerMappings(template.id, mappings);
      setSuccess('Marker mappings saved successfully!');
      
      if (onSave) {
        onSave({ ...template, markerMappings: JSON.stringify(mappings) });
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save marker mappings');
    } finally {
      setLoading(false);
    }
  };

  const templateMarkers = template.markers ? JSON.parse(template.markers) : [];
  const customMarkers = templateMarkers.filter(m => !m.isKnown);
  const knownMarkers = templateMarkers.filter(m => m.isKnown);

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Configure Smart Markers</h2>
        <p className="text-sm text-gray-600">
          Map template markers to data fields for automatic filling
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Known Markers */}
        {knownMarkers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Standard Markers</h3>
            <div className="space-y-2">
              {knownMarkers.map((marker) => {
                const markerInfo = availableMarkers.find(m => m.marker === marker.marker);
                return (
                  <div key={marker.marker} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <code className="text-sm font-mono text-blue-600">{marker.marker}</code>
                      {markerInfo && (
                        <p className="text-xs text-gray-500 mt-1">{markerInfo.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Auto-mapped</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Custom Markers */}
        {customMarkers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Custom Markers</h3>
            <div className="space-y-3">
              {customMarkers.map((marker) => (
                <div key={marker.marker} className="p-4 border border-gray-200 rounded-md">
                  <div className="flex items-start justify-between mb-2">
                    <code className="text-sm font-mono text-amber-600">{marker.marker}</code>
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                      <div className="hidden group-hover:block absolute right-0 top-5 z-10 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg">
                        Map this custom marker to a data field or leave unmapped to keep as-is
                      </div>
                    </div>
                  </div>
                  
                  <select
                    value={mappings[marker.marker] || ''}
                    onChange={(e) => handleMappingChange(marker.marker, e.target.value)}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- No mapping (keep as-is) --</option>
                    <optgroup label="VASP Information">
                      <option value="vaspName">VASP Name</option>
                      <option value="vaspLegalName">VASP Legal Name</option>
                      <option value="vaspEmail">VASP Email</option>
                      <option value="vaspAddress">VASP Address</option>
                      <option value="vaspJurisdiction">VASP Jurisdiction</option>
                    </optgroup>
                    <optgroup label="Case Information">
                      <option value="caseNumber">Case Number</option>
                      <option value="statute">Statute</option>
                      <option value="crimeDescription">Crime Description</option>
                    </optgroup>
                    <optgroup label="Agency Information">
                      <option value="agencyName">Agency Name</option>
                      <option value="agencyAddress">Agency Address</option>
                      <option value="investigatorName">Investigator Name</option>
                      <option value="investigatorTitle">Investigator Title</option>
                    </optgroup>
                    <optgroup label="Custom Fields">
                      <option value="customField1">Custom Field 1</option>
                      <option value="customField2">Custom Field 2</option>
                      <option value="customField3">Custom Field 3</option>
                    </optgroup>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No custom markers */}
        {customMarkers.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-md">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <p className="mt-2 text-sm text-gray-600">
              All markers in this template are automatically recognized!
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={handlePreview}
          disabled={loading}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded flex items-center"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview Template
        </button>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Mappings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Template Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkerMappingEditor;