import React, { useState, useEffect } from 'react';
import { Save, Edit2, Trash2, Plus, X, CheckCircle, AlertCircle, FileText, Upload, Map } from 'lucide-react';
import { templateAPI } from '../../services/api';
import SmartTemplateUpload from './SmartTemplateUpload';
import MarkerMappingEditor from './MarkerMappingEditor';

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showSmartUpload, setShowSmartUpload] = useState(false);
  const [mappingTemplate, setMappingTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateAPI.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError('Failed to load templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      setError(null);
      
      if (templateData.id) {
        // Update existing template
        await templateAPI.updateTemplate(templateData.id, templateData);
        setSuccess('Template updated successfully!');
      } else {
        // Create new template
        await templateAPI.createTemplate(templateData);
        setSuccess('Template created successfully!');
      }
      
      await loadTemplates();
      setEditingTemplate(null);
      setShowNewTemplate(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save template:', err);
      
      // Check if this is a demo restriction error
      if (err.response?.data?.isDemo) {
        setError(err.response.data.message || 'Demo users cannot save or modify templates.');
      } else {
        setError('Failed to save template. Please try again.');
      }
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      setError(null);
      await templateAPI.deleteTemplate(templateId);
      setSuccess('Template deleted successfully!');
      await loadTemplates();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete template:', err);
      
      // Check if this is a demo restriction error
      if (err.response?.data?.isDemo) {
        setError(err.response.data.message || 'Demo users cannot delete templates.');
      } else {
        setError('Failed to delete template. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
            <p className="mt-1 text-sm text-gray-600">
              Customize your subpoena and letterhead templates or upload smart templates
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSmartUpload(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Smart Template
            </button>
            <button
              onClick={() => setShowNewTemplate(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Basic Template
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto -mx-1.5 -my-1.5 bg-red-50 p-1.5 hover:bg-red-100 rounded"
              >
                <X className="h-5 w-5 text-red-500" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {showNewTemplate && (
          <TemplateEditor
            template={{
              name: '',
              document_type: 'subpoena',
              header_info: {},
              footer_text: '',
              custom_fields: {}
            }}
            onSave={handleSaveTemplate}
            onCancel={() => setShowNewTemplate(false)}
          />
        )}

        {showSmartUpload && (
          <SmartTemplateUpload
            onSuccess={(template) => {
              setShowSmartUpload(false);
              setMappingTemplate(template);
              loadTemplates();
            }}
            onCancel={() => setShowSmartUpload(false)}
          />
        )}

        {mappingTemplate && (
          <MarkerMappingEditor
            template={mappingTemplate}
            onSave={(template) => {
              setMappingTemplate(null);
              loadTemplates();
            }}
            onCancel={() => setMappingTemplate(null)}
          />
        )}

        <div className="grid grid-cols-1 gap-6">
          {templates.map((template) => (
            <div key={template.id}>
              {editingTemplate?.id === template.id ? (
                <TemplateEditor
                  template={editingTemplate}
                  onSave={handleSaveTemplate}
                  onCancel={() => setEditingTemplate(null)}
                />
              ) : (
                <TemplateCard
                  template={template}
                  onEdit={() => setEditingTemplate(template)}
                  onDelete={() => handleDeleteTemplate(template.id)}
                  onConfigureMarkers={() => setMappingTemplate(template)}
                />
              )}
            </div>
          ))}
        </div>

        {templates.length === 0 && !showNewTemplate && (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first document template.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowNewTemplate(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
              >
                Create Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TemplateCard = ({ template, onEdit, onDelete, onConfigureMarkers }) => {
  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'subpoena':
        return 'Subpoena';
      case 'letterhead':
        return 'Agency Letterhead';
      case 'freeze_request':
        return 'Freeze Request';
      case 'records_request':
        return 'Records Request';
      case 'seizure_warrant':
        return 'Seizure Warrant';
      default:
        return type;
    }
  };

  const isSmartTemplate = template.fileUrl || template.templateContent;
  const markers = template.markers ? JSON.parse(template.markers) : [];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium text-gray-900">{template.templateName || template.name}</h3>
            {isSmartTemplate && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Upload className="h-3 w-3 mr-1" />
                Smart Template
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Type: {getDocumentTypeLabel(template.templateType || template.document_type)}
          </p>

          {isSmartTemplate && markers.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                {markers.length} smart markers • {markers.filter(m => m.isKnown).length} recognized
              </p>
              {template.originalFilename && (
                <p className="text-xs text-gray-500 mt-1">
                  Uploaded from: {template.originalFilename}
                </p>
              )}
            </div>
          )}
          
          {template.header_info && Object.keys(template.header_info).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Header Information:</h4>
              <div className="mt-2 text-sm text-gray-600 space-y-1">
                {template.header_info.agency_name && (
                  <p>Agency: {template.header_info.agency_name}</p>
                )}
                {template.header_info.address && (
                  <p>Address: {template.header_info.address}</p>
                )}
                {template.header_info.phone && (
                  <p>Phone: {template.header_info.phone}</p>
                )}
                {template.header_info.email && (
                  <p>Email: {template.header_info.email}</p>
                )}
              </div>
            </div>
          )}
          
          {template.footer_text && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Footer Text:</h4>
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">{template.footer_text}</p>
            </div>
          )}
        </div>
        
        <div className="ml-6 flex items-center space-x-2">
          {isSmartTemplate && (
            <button
              onClick={onConfigureMarkers}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded"
              title="Configure markers"
            >
              <Map className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded"
            title="Edit template"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded"
            title="Delete template"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const TemplateEditor = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: template.name || '',
    document_type: template.document_type || 'subpoena',
    header_info: {
      agency_name: template.header_info?.agency_name || '',
      address: template.header_info?.address || '',
      phone: template.header_info?.phone || '',
      email: template.header_info?.email || '',
      ...template.header_info
    },
    footer_text: template.footer_text || '',
    custom_fields: template.custom_fields || {}
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...template,
      ...formData
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {template.id ? 'Edit Template' : 'New Template'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Federal Subpoena Template"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.document_type}
                onChange={(e) => setFormData({...formData, document_type: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="subpoena">Subpoena</option>
                <option value="letterhead">Agency Letterhead</option>
                <option value="freeze_request">Freeze Request</option>
                <option value="records_request">Records Request</option>
                <option value="seizure_warrant">Seizure Warrant</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Header Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agency Name
              </label>
              <input
                type="text"
                value={formData.header_info.agency_name}
                onChange={(e) => setFormData({
                  ...formData,
                  header_info: {...formData.header_info, agency_name: e.target.value}
                })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., U.S. Department of Justice"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.header_info.email}
                onChange={(e) => setFormData({
                  ...formData,
                  header_info: {...formData.header_info, email: e.target.value}
                })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="contact@agency.gov"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.header_info.address}
                onChange={(e) => setFormData({
                  ...formData,
                  header_info: {...formData.header_info, address: e.target.value}
                })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="123 Main St, Washington, DC 20001"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.header_info.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  header_info: {...formData.header_info, phone: e.target.value}
                })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer Text
          </label>
          <textarea
            value={formData.footer_text}
            onChange={(e) => setFormData({...formData, footer_text: e.target.value})}
            rows={3}
            className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any standard footer text, disclaimers, or legal notices..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </button>
        </div>
      </div>
    </form>
  );
};

export default TemplateManager;