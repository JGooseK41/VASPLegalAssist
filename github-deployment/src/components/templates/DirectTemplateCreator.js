import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DirectTemplateCreator = ({ onSuccess, onCancel, encryptedAPI }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isGlobal, setIsGlobal] = useState(false);
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!encryptedAPI) {
        setError('Encryption not ready. Please refresh the page.');
        return;
      }

      const dataToSend = {
        templateName: formData.templateName,
        templateType: formData.templateType,
        agencyHeader: formData.agencyHeader,
        agencyAddress: formData.agencyAddress,
        agencyContact: formData.agencyContact,
        footerText: formData.footerText,
        signatureBlock: formData.signatureBlock,
        templateContent: formData.templateContent,
        markers: formData.markers,
        markerMappings: '{}',
        isGlobal: user?.role === 'ADMIN' ? isGlobal : false,
        fileUrl: null,
        fileType: formData.fileType,
        fileSize: formData.templateContent.length,
        originalFilename: 'direct_template.html'
      };

      const response = await encryptedAPI.createTemplate(dataToSend);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error('Template creation error:', err);
      setError(err.response?.data?.error || 'Failed to create template');
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
                <span className="text-sm font-medium">Make this template available to all users</span>
              </span>
            </label>
          </div>
        )}

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
    </div>
  );
};

export default DirectTemplateCreator;