import React, { useState, useMemo } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Map, HelpCircle, Info, Lock, Globe } from 'lucide-react';
import { templateAPI } from '../../services/api';
import { useEncryption } from '../../hooks/useEncryption';
import { createEncryptedTemplateAPI } from '../../services/encryptedApi';
import { useAuth } from '../../contexts/AuthContext';

const SmartTemplateUpload = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [templateData, setTemplateData] = useState({
    templateName: '',
    templateType: 'letterhead',
    agencyHeader: '',
    agencyAddress: '',
    agencyContact: '',
    footerText: '',
    signatureBlock: ''
  });
  
  // Initialize encryption
  const encryption = useEncryption();
  const encryptedAPI = useMemo(() => {
    if (encryption.isKeyReady) {
      return createEncryptedTemplateAPI(encryption);
    }
    return null;
  }, [encryption]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('Selected file:', selectedFile.name, 'Type:', selectedFile.type);
      
      const allowedTypes = ['.docx', '.html', '.txt'];
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        setError(`Invalid file type. Please upload a DOCX, HTML, or TXT file. (Detected: ${fileExt})`);
        return;
      }
      
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setTemplateData({
        ...templateData,
        templateName: selectedFile.name.replace(/\.[^/.]+$/, '')
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('template', file);
      Object.entries(templateData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      // Add isGlobal flag if user is admin
      if (user?.role === 'ADMIN') {
        formData.append('isGlobal', isGlobal.toString());
      }

      if (!encryptedAPI) {
        setError('Encryption not ready. Please refresh the page.');
        return;
      }
      
      const response = await encryptedAPI.uploadTemplate(formData);
      
      setUploadResponse(response);
      
      if (response.validation.warnings.length > 0) {
        console.warn('Template warnings:', response.validation.warnings);
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      
      // Check if this is a demo restriction error
      if (err.response?.data?.isDemo) {
        setError(err.response.data.message || 'Demo users cannot upload templates.');
      } else {
        setError(err.response?.data?.error || 'Failed to upload template');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (uploadResponse && onSuccess) {
      onSuccess(uploadResponse.template);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Smart Template</h2>
            <p className="text-sm text-gray-600">
              Upload your personalized document template with smart placeholders for automatic data filling.
            </p>
            {encryption.isKeyReady && (
              <div className="mt-2 flex items-center text-xs text-green-600">
                <Lock className="h-3 w-3 mr-1" />
                Your template will be encrypted before upload
              </div>
            )}
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-600 hover:text-blue-800 p-2"
            title="Template creation guide"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showHelp && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How to Create Your Personalized Template</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                  <li><strong>Start with your existing document</strong> - Use your agency's official letterhead or subpoena template in Word format</li>
                  <li><strong>Add smart placeholders</strong> - Replace static text with placeholders in double curly braces: {`{{PLACEHOLDER_NAME}}`}</li>
                  <li><strong>Save and upload</strong> - Save your Word document and upload it here. Give it a memorable name!</li>
                  <li><strong>Reuse anytime</strong> - Your template will be saved to your account and available for all future sessions</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Common Placeholders You Can Use:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-mono bg-white px-2 py-1 rounded">{`{{VASP_NAME}}`} - Service provider name</div>
                  <div className="font-mono bg-white px-2 py-1 rounded">{`{{CASE_NUMBER}}`} - Case reference</div>
                  <div className="font-mono bg-white px-2 py-1 rounded">{`{{DATE}}`} - Current date</div>
                  <div className="font-mono bg-white px-2 py-1 rounded">{`{{AGENT_NAME}}`} - Your name</div>
                  <div className="font-mono bg-white px-2 py-1 rounded">{`{{AGENCY_NAME}}`} - Your agency</div>
                  <div className="font-mono bg-white px-2 py-1 rounded">{`{{VASP_ADDRESS}}`} - Provider address</div>
                  <div className="font-mono bg-white px-2 py-1 rounded">{`{{CRIME_TYPE}}`} - Crime description</div>
                  <div className="font-mono bg-white px-2 py-1 rounded">{`{{STATUTE}}`} - Legal statute</div>
                </div>
              </div>
              
              <div className="bg-white rounded p-3">
                <p className="text-xs text-gray-600">
                  <strong>Example:</strong> Replace "ABC Exchange, Inc." in your template with {`{{VASP_NAME}}`}. 
                  When you generate documents, this will automatically fill with the selected VASP's name.
                </p>
              </div>
              
              <p className="text-sm font-semibold text-blue-900">
                ✓ Templates are saved permanently to your account<br/>
                ✓ Create multiple templates for different purposes<br/>
                ✓ Edit or update your templates anytime
              </p>
            </div>
          </div>
        </div>
      )}

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

      {!uploadResponse ? (
        <>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".docx,.html,.txt"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    DOCX, HTML, or TXT up to 5MB
                  </p>
                </div>
              </div>
              {file && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                  <span className="text-xs font-normal text-gray-500 ml-2">(This will be saved for future use)</span>
                </label>
                <input
                  type="text"
                  value={templateData.templateName}
                  onChange={(e) => setTemplateData({...templateData, templateName: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Federal Subpoena with Smart Markers"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={templateData.templateType}
                  onChange={(e) => setTemplateData({...templateData, templateType: e.target.value})}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="letterhead">Agency Letterhead</option>
                  <option value="subpoena">Subpoena</option>
                  <option value="freeze_request">Freeze Request</option>
                  <option value="records_request">Records Request</option>
                  <option value="seizure_warrant">Seizure Warrant</option>
                </select>
              </div>
            </div>

            {/* Admin-only option to make template global */}
            {user?.role === 'ADMIN' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isGlobal}
                    onChange={(e) => setIsGlobal(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 flex items-center">
                    <Globe className="h-4 w-4 mr-1 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Make this template available to all users</span>
                  </span>
                </label>
                <p className="mt-1 ml-6 text-xs text-gray-600">
                  Global templates can be used by all users but only edited by administrators
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agency Header (Optional)
              </label>
              <input
                type="text"
                value={templateData.agencyHeader}
                onChange={(e) => setTemplateData({...templateData, agencyHeader: e.target.value})}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., U.S. Department of Justice"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Template
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Template uploaded successfully!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Found {uploadResponse.markers.length} smart markers in your template.
                </p>
              </div>
            </div>
          </div>

          {uploadResponse.validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
                  <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                    {uploadResponse.validation.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Detected Smart Markers</h3>
            <div className="border border-gray-200 rounded-md p-4 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {uploadResponse.markers.map((marker, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="font-mono text-gray-600">{marker.marker}</span>
                    {marker.isKnown ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Recognized
                      </span>
                    ) : (
                      <span className="text-yellow-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Custom
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded"
            >
              Upload Another
            </button>
            <button
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
            >
              <Map className="h-4 w-4 mr-2" />
              Configure Markers
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartTemplateUpload;