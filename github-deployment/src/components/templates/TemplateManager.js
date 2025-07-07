import React, { useState, useEffect, useMemo } from 'react';
import { Save, Edit2, Trash2, Plus, X, CheckCircle, AlertCircle, FileText, Upload, Map, Lock, Unlock, HelpCircle, BookOpen, FileCode, Lightbulb } from 'lucide-react';
import { templateAPI } from '../../services/api';
import { useEncryption } from '../../hooks/useEncryption';
import { createEncryptedTemplateAPI } from '../../services/encryptedApi';
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
  const [showEncryptionStatus, setShowEncryptionStatus] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [encryptionTimeout, setEncryptionTimeout] = useState(false);
  
  // Initialize encryption
  const encryption = useEncryption();
  const encryptedAPI = useMemo(() => {
    if (encryption.isKeyReady) {
      return createEncryptedTemplateAPI(encryption);
    }
    return null;
  }, [encryption.isKeyReady, encryption.encrypt, encryption.decrypt]);

  useEffect(() => {
    if (encryptedAPI) {
      loadTemplates();
    } else if (encryption.isKeyReady === false) {
      // If encryption failed to initialize, still show the UI
      setLoading(false);
      setError('Encryption initialization failed. Templates may not be available.');
    }
  }, [encryptedAPI, encryption.isKeyReady]);

  // Separate timeout effect to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading && !encryptedAPI) {
        setLoading(false);
        setEncryptionTimeout(true);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!encryptedAPI) {
        setError('Encryption not ready. Please refresh the page.');
        setLoading(false);
        return;
      }
      
      const data = await encryptedAPI.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to load templates. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      setError(null);
      
      if (!encryptedAPI) {
        setError('Encryption not ready. Please refresh the page.');
        return;
      }
      
      if (templateData.id) {
        // Update existing template
        await encryptedAPI.updateTemplate(templateData.id, templateData);
        setSuccess('Template updated successfully! (Encrypted)');
      } else {
        // Create new template
        await encryptedAPI.createTemplate(templateData);
        setSuccess('Template created successfully! (Encrypted)');
      }
      
      await loadTemplates();
      setEditingTemplate(null);
      setShowNewTemplate(false);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save template:', err);
      console.error('Error response:', err.response?.data);
      
      // Check if this is a demo restriction error
      if (err.response?.data?.isDemo) {
        setError(err.response.data.message || 'Demo users cannot save or modify templates.');
      } else {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to save template. Please try again.';
        setError(errorMessage);
      }
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      setError(null);
      
      if (!encryptedAPI) {
        setError('Encryption not ready. Please refresh the page.');
        return;
      }
      
      await encryptedAPI.deleteTemplate(templateId);
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
            {encryption.isKeyReady && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <Lock className="h-3 w-3 mr-1" />
                Client-side encryption active
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowHelp(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help Guide
            </button>
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

        {(error || encryptionTimeout) && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  {error || 'Encryption is taking longer than expected. You can still create templates, but they may not be encrypted until you refresh the page.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setEncryptionTimeout(false);
                }}
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
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome to Template Manager!</h3>
                  <p className="text-sm text-blue-800">
                    Templates allow you to create professional legal documents quickly and consistently. 
                    Your templates are encrypted and only visible to you.
                  </p>
                </div>
              </div>
            </div>

            {/* Getting Started Guide */}
            <div className="bg-white shadow rounded-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Choose How to Get Started</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Basic Template Option */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                  <div className="flex items-center mb-4">
                    <FileText className="h-8 w-8 text-blue-600 mr-3" />
                    <h4 className="text-lg font-medium text-gray-900">Basic Template</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Perfect for simple documents. Fill out forms to add your agency information, 
                    headers, and footers.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Quick and easy setup</li>
                    <li>• No technical knowledge required</li>
                    <li>• Good for standard formats</li>
                  </ul>
                  <button
                    onClick={() => setShowNewTemplate(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Create Basic Template
                  </button>
                </div>

                {/* Smart Template Option */}
                <div className="border border-gray-200 rounded-lg p-6 hover:border-green-300 transition-colors">
                  <div className="flex items-center mb-4">
                    <FileCode className="h-8 w-8 text-green-600 mr-3" />
                    <h4 className="text-lg font-medium text-gray-900">Smart Template</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your existing Word documents with placeholders. Maintains your exact 
                    formatting and branding.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>• Use your existing templates</li>
                    <li>• Preserves complex formatting</li>
                    <li>• Supports logos and images</li>
                  </ul>
                  <button
                    onClick={() => setShowSmartUpload(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                  >
                    Upload Smart Template
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowHelp(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  View Detailed Guide
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <HelpCircle className="h-6 w-6 mr-2 text-blue-600" />
                  Template Creation Guide
                </h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Overview Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
                  <p className="text-gray-600 mb-4">
                    The Template Manager allows you to create reusable document templates for generating legal documents 
                    quickly and consistently. All templates are encrypted and only accessible by you.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      <strong>Security Note:</strong> Your templates are encrypted using military-grade encryption. 
                      Not even administrators can see your templates or generated documents.
                    </p>
                  </div>
                </section>

                {/* Basic Templates Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Creating Basic Templates</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Basic templates are perfect for simple documents where you need standard formatting.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Steps:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>Click "New Basic Template"</li>
                        <li>Choose a document type (Subpoena, Letterhead, etc.)</li>
                        <li>Fill in your agency information:
                          <ul className="list-disc list-inside ml-5 mt-1">
                            <li>Agency name and address</li>
                            <li>Contact information</li>
                            <li>Badge/ID numbers</li>
                          </ul>
                        </li>
                        <li>Customize header and footer text</li>
                        <li>Save your template</li>
                      </ol>
                    </div>
                  </div>
                </section>

                {/* Smart Templates Section */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Creating Smart Templates</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Smart templates let you upload existing Word documents with placeholders that automatically 
                      fill with case data.
                    </p>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Available Placeholders:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm font-mono text-blue-800">
                        <div>{`{{vasp_name}}`}</div>
                        <div>{`{{case_number}}`}</div>
                        <div>{`{{vasp_legal_name}}`}</div>
                        <div>{`{{statute}}`}</div>
                        <div>{`{{vasp_email}}`}</div>
                        <div>{`{{crime_description}}`}</div>
                        <div>{`{{vasp_address}}`}</div>
                        <div>{`{{date_today}}`}</div>
                        <div className="col-span-2 font-bold text-blue-900 mt-2">Transaction Placeholders:</div>
                        <div>{`{{transaction_table}}`}</div>
                        <div>{`{{transaction_list}}`}</div>
                        <div>{`{{transaction_count}}`}</div>
                        <div>{`{{transaction_id}}`}</div>
                        <div>{`{{from_address}}`}</div>
                        <div>{`{{to_address}}`}</div>
                        <div>{`{{amount}}`}</div>
                        <div>{`{{currency}}`}</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Steps:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>Create your template in Microsoft Word</li>
                        <li>Add placeholders where you want data inserted (e.g., {`{{case_number}}`})</li>
                        <li>Include your agency letterhead, logos, and formatting</li>
                        <li>Save as .docx format (not .doc or PDF)</li>
                        <li>Click "Upload Smart Template"</li>
                        <li>Select your file and upload</li>
                        <li>The system will detect placeholders automatically</li>
                        <li>Map any custom placeholders if needed</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Pro Tip:</strong> You can use conditional formatting in Word. For example, 
                        create different sections for different types of requests, and only include the 
                        placeholders you need in each section.
                      </p>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <h4 className="font-medium text-green-900 mb-2">Transaction Table Feature</h4>
                      <p className="text-sm text-green-800 mb-2">
                        Use {`{{transaction_table}}`} to automatically generate a formatted table of all transactions 
                        from your CSV import. This is perfect when your template has space for only one transaction 
                        but you need to document multiple transactions.
                      </p>
                      <ul className="text-sm text-green-800 list-disc list-inside">
                        <li>{`{{transaction_table}}`} - Creates a table with all transactions</li>
                        <li>{`{{transaction_list}}`} - Simple text list of transaction IDs and dates</li>
                        <li>{`{{transaction_count}}`} - Total number of transactions</li>
                        <li>Single placeholders ({`{{transaction_id}}`}, etc.) - Uses the first transaction</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* Best Practices */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Best Practices</h3>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Create separate templates for different types of requests (subpoenas, freeze requests, etc.)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Include your official letterhead and logos in smart templates</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Test your templates with sample data before using them for real cases</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Keep placeholder names consistent across templates</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span>Name templates descriptively (e.g., "Federal Subpoena - Crypto Exchange")</span>
                    </li>
                  </ul>
                </section>

                {/* Troubleshooting */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Troubleshooting</h3>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Placeholders not detected?</h4>
                      <p className="text-sm text-gray-600">
                        Ensure you're using double curly braces {`{{like_this}}`} and that your document is 
                        saved as .docx format.
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Formatting lost after upload?</h4>
                      <p className="text-sm text-gray-600">
                        Make sure you're using a .docx file (not .doc). Complex formatting like tables and 
                        images are preserved in smart templates.
                      </p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Template not saving?</h4>
                      <p className="text-sm text-gray-600">
                        Check that all required fields are filled. Demo accounts cannot save templates - 
                        you need a full account.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Close Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TemplateCard = ({ template, onEdit, onDelete, onConfigureMarkers }) => {
  const isEncrypted = template.isClientEncrypted || false;
  const hasDecryptionError = template.decryptionError || false;
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
            <h3 className="text-lg font-medium text-gray-900">
              {hasDecryptionError ? 'Encrypted Template (Unable to Decrypt)' : (template.templateName || template.name)}
            </h3>
            {isEncrypted && !hasDecryptionError && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Lock className="h-3 w-3 mr-1" />
                Encrypted
              </span>
            )}
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
          
          {hasDecryptionError && (
            <div className="mt-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              {template.errorMessage || 'Unable to decrypt template data'}
            </div>
          )}
          
          {!hasDecryptionError && template.header_info && Object.keys(template.header_info).length > 0 && (
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