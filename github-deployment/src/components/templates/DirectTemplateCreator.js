import React, { useState } from 'react';
import { Globe, Users, Database } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { templateAPI } from '../../services/api';
import TemplateSharingModal from './TemplateSharingModal';
import DataStructureDesigner from './DataStructureDesigner';

const DirectTemplateCreator = ({ onSuccess, onCancel, encryptedAPI }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGlobal, setIsGlobal] = useState(false);
  const [shareWithCommunity, setShareWithCommunity] = useState(false);
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [showDataDesigner, setShowDataDesigner] = useState(false);
  
  const [useEncryption, setUseEncryption] = useState(true);
  const [dataStructure, setDataStructure] = useState(null);
  
  const [formData, setFormData] = useState({
    templateName: 'Standard VASP Data Request',
    templateType: 'letterhead',
    agencyHeader: 'Law Enforcement Agency',
    agencyAddress: '',
    agencyContact: '',
    footerText: 'Thank you for your cooperation in this matter.',
    signatureBlock: 'Sincerely,',
    templateContent: `{{date_today}}
 
To: {{vasp_legal_name}}
DBA: {{vasp_name}}
{{vasp_address}}

Re: {{agency_name}} Case # {{case_number}} 

The {{agency_name}} is conducting a criminal investigation regarding the theft of funds via virtual assets/cryptocurrencies as a result of a {{crime_under_investigation}} which is a criminal violation under {{statute}} of the laws of {{jurisdiction}}. To wit:

{{facts_of_the_case}}

The funds were traced to a {{vasp_name}} hosted wallet. We respectfully request your assistance in obtaining the following account information on said {{vasp_name}} hosted wallet. We are requesting all documents, including but not limited to, customer information, account balance, assets overview, order history, deposit history, fiat deposit history, withdrawal history, fiat withdrawal history, P2P, access logs, approved devices, KYC, funding wallet, OTC trade order, and any other information related to the {{vasp_name}} account holder for the following transaction(s). 

{{transaction_table}}


Respectfully, 

___________________
{{agent_title}} {{agent_name}}
{{agent_email}}
{{agency_name}}            
{{agency_address}}                        
Office: {{agent_phone}}`,
    fileType: 'html',
    markers: JSON.stringify([
      '{{date_today}}', '{{vasp_legal_name}}', '{{vasp_name}}', '{{vasp_address}}',
      '{{agency_name}}', '{{case_number}}', '{{crime_under_investigation}}',
      '{{statute}}', '{{jurisdiction}}', '{{facts_of_the_case}}',
      '{{transaction_table}}', '{{agent_title}}', '{{agent_name}}',
      '{{agent_email}}', '{{agency_address}}', '{{agent_phone}}'
    ])
  });

  const handleShareToggle = (checked) => {
    if (checked) {
      setShowSharingModal(true);
    } else {
      setShareWithCommunity(false);
      setUseEncryption(true);
    }
  };

  const handleSharingConfirm = (sharingData) => {
    setShareWithCommunity(true);
    setUseEncryption(false); // Shared templates cannot be encrypted
    setShowSharingModal(false);
    // Store sharing data in formData
    setFormData(prev => ({
      ...prev,
      ...sharingData
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dataToSend = {
        templateName: formData.templateName,
        templateType: formData.templateType,
        agencyHeader: formData.agencyHeader || '',
        agencyAddress: formData.agencyAddress || '',
        agencyContact: formData.agencyContact || '',
        footerText: formData.footerText || '',
        signatureBlock: formData.signatureBlock || '',
        templateContent: formData.templateContent,
        markers: formData.markers,
        markerMappings: '{}',
        customFields: {},  // Add empty customFields
        dataStructure: dataStructure ? JSON.stringify(dataStructure) : null,
        isGlobal: user?.role === 'ADMIN' ? isGlobal : false,
        isUserShared: shareWithCommunity,
        sharedTitle: formData.sharedTitle || null,
        sharedDescription: formData.sharedDescription || null,
        allowedDomains: formData.allowedDomains || [],
        fileUrl: null,
        fileType: formData.fileType,
        fileSize: formData.templateContent.length,
        originalFilename: 'direct_template.html',
        isClientEncrypted: useEncryption && !shareWithCommunity // Cannot encrypt shared templates
      };

      console.log('Sending template data:', dataToSend);
      console.log('Using encryption:', useEncryption);
      console.log('Template content length:', dataToSend.templateContent?.length);
      console.log('Markers:', dataToSend.markers);
      
      let response;
      if (useEncryption && encryptedAPI && !shareWithCommunity) {
        console.log('Using encryptedAPI');
        response = await encryptedAPI.createTemplate(dataToSend);
      } else {
        console.log('Using standard API (no encryption)');
        response = await templateAPI.createTemplate(dataToSend);
      }
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error('Template creation error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error details:', JSON.stringify(err.response?.data, null, 2));
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Template Directly</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name
          </label>
          <input
            type="text"
            value={formData.templateName}
            onChange={(e) => setFormData({...formData, templateName: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Type
          </label>
          <select
            value={formData.templateType}
            onChange={(e) => setFormData({...formData, templateType: e.target.value})}
            className="w-full border rounded px-3 py-2"
          >
            <option value="letterhead">Agency Letterhead</option>
            <option value="subpoena">Subpoena</option>
            <option value="freeze_request">Freeze Request</option>
            <option value="records_request">Records Request</option>
          </select>
        </div>

        {user?.role === 'ADMIN' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isGlobal}
                onChange={(e) => setIsGlobal(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded mr-2"
              />
              <span className="flex items-center">
                <Globe className="h-4 w-4 mr-1 text-blue-600" />
                <span className="text-sm font-medium">Make this template available to all users (Admin)</span>
              </span>
            </label>
          </div>
        )}
        
        {/* Data Structure Designer Button */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <button
            type="button"
            onClick={() => setShowDataDesigner(true)}
            className="w-full flex items-center justify-between px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Configure Data Structure
            </span>
            <span className="text-sm opacity-90">
              {dataStructure ? 'Structure Configured' : 'Optional'}
            </span>
          </button>
          <p className="text-xs text-gray-600 mt-2">
            Design how to import multiple wallets and transactions in a single request
          </p>
        </div>

        {/* Community Sharing Option */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              checked={shareWithCommunity}
              onChange={(e) => handleShareToggle(e.target.checked)}
              className="h-4 w-4 text-green-600 rounded mr-2 mt-0.5"
              disabled={isGlobal} // Cannot share if admin is making it global
            />
            <div className="flex-1">
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-green-600" />
                <span className="text-sm font-medium">Share with community</span>
              </span>
              <p className="text-xs text-gray-600 mt-1">
                Share your template with other users and earn points when they use it.
                {shareWithCommunity && ' Template will not be encrypted.'}
              </p>
            </div>
          </label>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useEncryption}
              onChange={(e) => setUseEncryption(e.target.checked)}
              className="h-4 w-4 text-yellow-600 rounded mr-2"
              disabled={shareWithCommunity} // Cannot encrypt shared templates
            />
            <span className="text-sm">
              <span className="font-medium">Use encryption</span> 
              {shareWithCommunity ? ' (disabled for shared templates)' : ' (uncheck if having issues)'}
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Content (with placeholders)
          </label>
          <textarea
            value={formData.templateContent}
            onChange={(e) => setFormData({...formData, templateContent: e.target.value})}
            className="w-full border rounded px-3 py-2 font-mono text-sm"
            rows={15}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Template'}
          </button>
        </div>
      </form>
      </div>
      
      {/* Sharing Consent Modal */}
      <TemplateSharingModal
        isOpen={showSharingModal}
        onClose={() => setShowSharingModal(false)}
        onConfirm={handleSharingConfirm}
        templateName={formData.templateName}
      />

      {/* Data Structure Designer Modal */}
      <DataStructureDesigner
        isOpen={showDataDesigner}
        onClose={() => setShowDataDesigner(false)}
        onSave={(structure) => {
          setDataStructure(structure);
          setShowDataDesigner(false);
        }}
        existingStructure={dataStructure}
      />
    </div>
  );
};

export default DirectTemplateCreator;