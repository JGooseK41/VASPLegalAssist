import React, { useState } from 'react';
import { Upload, Download, Shield, AlertCircle, CheckCircle, FileText, Lock, Unlock } from 'lucide-react';
import { documentAPI } from '../../services/api';

const DocumentDecryptor = () => {
  const [file, setFile] = useState(null);
  const [decrypting, setDecrypting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile.name.endsWith('.encrypted')) {
      setError('Please select a .encrypted file');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setSuccess(null);
  };

  const handleDecrypt = async () => {
    if (!file) {
      setError('Please select a file to decrypt');
      return;
    }

    setDecrypting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await documentAPI.decryptPackage(formData);
      
      // The response should be a blob
      const blob = new Blob([response], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Extract original filename from the encrypted file name
      const originalName = file.name.replace('_encrypted_', '_').replace('.encrypted', '.docx');
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Document decrypted and downloaded successfully!');
      setFile(null);
    } catch (err) {
      console.error('Decryption error:', err);
      if (err.response?.status === 403) {
        setError('This document was not encrypted for your account and cannot be decrypted.');
      } else {
        setError(err.response?.data?.error || 'Failed to decrypt document. Please try again.');
      }
    } finally {
      setDecrypting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Unlock className="h-6 w-6 mr-2" />
          Decrypt Document
        </h1>
        <p className="mt-2 text-gray-600">
          Upload an encrypted document package (.encrypted file) to decrypt it
        </p>
      </div>

      {/* Security Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Secure Decryption</h3>
            <div className="mt-2 text-sm text-blue-800">
              <ul className="list-disc list-inside space-y-1">
                <li>Only documents encrypted for your account can be decrypted</li>
                <li>Your unique encryption key is derived from your user ID</li>
                <li>Even administrators cannot decrypt your documents</li>
                <li>Decryption happens entirely on our secure servers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* File Upload Area */}
      <div className="bg-white shadow rounded-lg p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".encrypted"
            onChange={handleFileSelect}
          />
          
          <Lock className="mx-auto h-12 w-12 text-gray-400" />
          
          <label
            htmlFor="file-upload"
            className="mt-4 cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Encrypted File
          </label>
          
          <p className="mt-2 text-sm text-gray-600">
            or drag and drop your .encrypted file here
          </p>
        </div>

        {file && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-sm text-gray-900">{file.name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {file && (
          <div className="mt-6">
            <button
              onClick={handleDecrypt}
              disabled={decrypting}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {decrypting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Decrypting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Decrypt and Download
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">How Document Encryption Works</h3>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium text-gray-900">1. Document Creation</h4>
            <p>When you create a document, sensitive information is encrypted with your unique key before storage.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">2. Encrypted Download</h4>
            <p>Documents are downloaded as .encrypted packages that can only be opened by you.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">3. Secure Decryption</h4>
            <p>Upload the .encrypted file here to decrypt it back to the original Word document.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">4. Complete Privacy</h4>
            <p>Your documents remain private - not even system administrators can decrypt them.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDecryptor;