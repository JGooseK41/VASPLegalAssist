import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Map } from 'lucide-react';
import { templateAPI } from '../../services/api';

const SmartTemplateUpload = ({ onSuccess, onCancel }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [templateData, setTemplateData] = useState({
    templateName: '',
    templateType: 'letterhead',
    agencyHeader: '',
    agencyAddress: '',
    agencyContact: '',
    footerText: '',
    signatureBlock: ''
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['.docx', '.html', '.txt'];
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        setError('Invalid file type. Please upload a DOCX, HTML, or TXT file.');
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

      const response = await templateAPI.uploadTemplate(formData);
      
      setUploadResponse(response);
      
      if (response.validation.warnings.length > 0) {
        console.warn('Template warnings:', response.validation.warnings);
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload template');
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
        <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Smart Template</h2>
        <p className="text-sm text-gray-600">
          Upload a document template with smart markers like {'{{VASP_NAME}}'}, {'{{CASE_NUMBER}}'}, etc.
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
                  <option value="subpoena">Grand Jury Subpoena</option>
                </select>
              </div>
            </div>

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