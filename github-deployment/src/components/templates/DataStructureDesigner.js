import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Wallet, ArrowRightLeft, Info, Copy, Save, Database, List, Table } from 'lucide-react';

const DataStructureDesigner = ({ isOpen, onClose, onSave, existingStructure }) => {
  const [activeTab, setActiveTab] = useState('request_info');
  const [structure, setStructure] = useState(existingStructure || {
    request_info_list: {
      enabled: false,
      fields: [
        { name: 'info_type', label: 'Information Type', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'text', required: false }
      ],
      allowMultiple: true,
      groupBy: null
    },
    request_info: {
      enabled: true,
      fields: [
        { name: 'kyc_info', label: 'KYC Information', type: 'checkbox', required: false },
        { name: 'transaction_history', label: 'Transaction History', type: 'checkbox', required: false },
        { name: 'ip_addresses', label: 'IP Addresses', type: 'checkbox', required: false },
        { name: 'device_info', label: 'Device Information', type: 'checkbox', required: false },
        { name: 'account_activity', label: 'Account Activity', type: 'checkbox', required: false },
        { name: 'linked_accounts', label: 'Linked Accounts', type: 'checkbox', required: false },
        { name: 'source_of_funds', label: 'Source of Funds', type: 'checkbox', required: false },
        { name: 'communications', label: 'Communications', type: 'checkbox', required: false }
      ],
      format: 'checkboxes' // checkboxes, list, table
    },
    transaction_table: {
      enabled: true,
      fields: [
        { name: 'transaction_id', label: 'Transaction ID', type: 'text', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true },
        { name: 'from_address', label: 'From Address', type: 'text', required: true },
        { name: 'to_address', label: 'To Address', type: 'text', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: true },
        { name: 'currency', label: 'Currency', type: 'text', required: true }
      ],
      allowMultiple: true,
      groupBy: 'wallet' // null, 'wallet', 'currency', 'date'
    },
    transaction_list: {
      enabled: false,
      fields: [
        { name: 'transaction_hash', label: 'Transaction Hash', type: 'text', required: true },
        { name: 'blockchain', label: 'Blockchain', type: 'select', required: true, options: ['Bitcoin', 'Ethereum', 'BSC', 'Polygon', 'Other'] },
        { name: 'wallet_address', label: 'Wallet Address', type: 'text', required: true },
        { name: 'amount', label: 'Amount', type: 'number', required: false },
        { name: 'notes', label: 'Notes', type: 'textarea', required: false }
      ],
      format: 'list', // list, numbered, bullets
      allowMultiple: true
    },
    wallets: {
      enabled: false,
      fields: [
        { name: 'wallet_address', label: 'Wallet Address', type: 'text', required: true },
        { name: 'wallet_type', label: 'Wallet Type', type: 'select', required: true, options: ['Hosted', 'Non-Custodial', 'Hardware', 'Exchange'] },
        { name: 'blockchain', label: 'Blockchain', type: 'select', required: true, options: ['Bitcoin', 'Ethereum', 'BSC', 'Polygon', 'Other'] },
        { name: 'owner_name', label: 'Owner Name', type: 'text', required: false },
        { name: 'notes', label: 'Notes', type: 'textarea', required: false }
      ],
      allowMultiple: true,
      linkToTransactions: true
    }
  });

  const [expandedSections, setExpandedSections] = useState({
    request_info_list: false,
    request_info: true,
    transaction_table: true,
    transaction_list: false,
    wallets: false
  });

  const fieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' },
    { value: 'url', label: 'URL' }
  ];

  const handleAddField = (section) => {
    const newField = {
      name: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false
    };
    
    setStructure(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        fields: [...prev[section].fields, newField]
      }
    }));
  };

  const handleUpdateField = (section, index, updates) => {
    setStructure(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        fields: prev[section].fields.map((field, i) => 
          i === index ? { ...field, ...updates } : field
        )
      }
    }));
  };

  const handleRemoveField = (section, index) => {
    setStructure(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        fields: prev[section].fields.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSectionToggle = (section) => {
    setStructure(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: !prev[section].enabled
      }
    }));
  };

  const toggleExpanded = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSectionIcon = (section) => {
    switch(section) {
      case 'request_info_list':
      case 'request_info':
        return <Info className="h-4 w-4" />;
      case 'transaction_table':
        return <Table className="h-4 w-4" />;
      case 'transaction_list':
        return <List className="h-4 w-4" />;
      case 'wallets':
        return <Wallet className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getSectionTitle = (section) => {
    switch(section) {
      case 'request_info_list':
        return 'Request Information List';
      case 'request_info':
        return 'Request Information (Checkboxes)';
      case 'transaction_table':
        return 'Transaction Table';
      case 'transaction_list':
        return 'Transaction List';
      case 'wallets':
        return 'Wallet Management';
      default:
        return section;
    }
  };

  const handleSave = () => {
    onSave(structure);
    onClose();
  };

  const generatePreview = (section) => {
    const config = structure[section];
    if (!config.enabled) return null;

    switch(section) {
      case 'transaction_table':
        return (
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  {config.fields.map(field => (
                    <th key={field.name} className="text-left p-1 text-xs">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="text-gray-500">
                  {config.fields.map(field => (
                    <td key={field.name} className="p-1">
                      [Sample]
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      case 'request_info':
        if (config.format === 'checkboxes') {
          return (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
              {config.fields.slice(0, 3).map(field => (
                <div key={field.name} className="flex items-center">
                  <span className="mr-2">☐</span>
                  <span>{field.label}</span>
                </div>
              ))}
              {config.fields.length > 3 && <div className="text-gray-500">...and {config.fields.length - 3} more</div>}
            </div>
          );
        }
        break;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Data Structure Designer</h2>
            <p className="text-sm text-gray-600 mt-1">Configure how to import and structure multiple wallets and transactions</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Panel - Sections */}
          <div className="w-1/3 bg-gray-50 p-4 overflow-y-auto border-r">
            <h3 className="font-semibold text-gray-700 mb-4">Data Sections</h3>
            <div className="space-y-3">
              {Object.keys(structure).map(section => (
                <div key={section} className={`bg-white rounded-lg shadow-sm border ${structure[section].enabled ? 'border-blue-300' : 'border-gray-200'}`}>
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getSectionIcon(section)}
                        <span className="font-medium text-sm">{getSectionTitle(section)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={structure[section].enabled}
                            onChange={() => handleSectionToggle(section)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <button
                          onClick={() => toggleExpanded(section)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedSections[section] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {expandedSections[section] && structure[section].enabled && (
                      <div className="mt-3">
                        {structure[section].allowMultiple && (
                          <div className="mb-2">
                            <label className="text-xs text-gray-600">Allow Multiple:</label>
                            <input
                              type="checkbox"
                              checked={structure[section].allowMultiple}
                              onChange={(e) => setStructure(prev => ({
                                ...prev,
                                [section]: {
                                  ...prev[section],
                                  allowMultiple: e.target.checked
                                }
                              }))}
                              className="ml-2"
                            />
                          </div>
                        )}
                        
                        {structure[section].groupBy !== undefined && (
                          <div className="mb-2">
                            <label className="text-xs text-gray-600 block">Group By:</label>
                            <select
                              value={structure[section].groupBy || ''}
                              onChange={(e) => setStructure(prev => ({
                                ...prev,
                                [section]: {
                                  ...prev[section],
                                  groupBy: e.target.value || null
                                }
                              }))}
                              className="mt-1 w-full text-xs p-1 border rounded"
                            >
                              <option value="">None</option>
                              <option value="wallet">Wallet</option>
                              <option value="currency">Currency</option>
                              <option value="date">Date</option>
                            </select>
                          </div>
                        )}
                        
                        {generatePreview(section)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Field Configuration */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="mb-4">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {Object.keys(structure).map(section => (
                  <option key={section} value={section} disabled={!structure[section].enabled}>
                    {getSectionTitle(section)} {!structure[section].enabled && '(Disabled)'}
                  </option>
                ))}
              </select>
            </div>

            {structure[activeTab] && structure[activeTab].enabled && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Fields Configuration</h3>
                  <button
                    onClick={() => handleAddField(activeTab)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Field</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {structure[activeTab].fields.map((field, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-600">Field Name (ID)</label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(activeTab, index, { name: e.target.value })}
                            className="w-full mt-1 p-2 border rounded text-sm"
                            placeholder="field_name"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600">Display Label</label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(activeTab, index, { label: e.target.value })}
                            className="w-full mt-1 p-2 border rounded text-sm"
                            placeholder="Field Label"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-600">Field Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(activeTab, index, { type: e.target.value })}
                            className="w-full mt-1 p-2 border rounded text-sm"
                          >
                            {fieldTypes.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {field.type === 'select' && (
                        <div className="mt-3">
                          <label className="text-xs text-gray-600">Options (comma-separated)</label>
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => handleUpdateField(activeTab, index, { 
                              options: e.target.value.split(',').map(opt => opt.trim())
                            })}
                            className="w-full mt-1 p-2 border rounded text-sm"
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateField(activeTab, index, { required: e.target.checked })}
                          />
                          <span className="text-sm text-gray-700">Required Field</span>
                        </label>
                        
                        <button
                          onClick={() => handleRemoveField(activeTab, index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {structure[activeTab].format !== undefined && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 block mb-2">Display Format</label>
                    <select
                      value={structure[activeTab].format}
                      onChange={(e) => setStructure(prev => ({
                        ...prev,
                        [activeTab]: {
                          ...prev[activeTab],
                          format: e.target.value
                        }
                      }))}
                      className="w-full p-2 border rounded"
                    >
                      {activeTab === 'request_info' && (
                        <>
                          <option value="checkboxes">Checkboxes</option>
                          <option value="list">Bulleted List</option>
                          <option value="table">Table</option>
                        </>
                      )}
                      {activeTab === 'transaction_list' && (
                        <>
                          <option value="list">Simple List</option>
                          <option value="numbered">Numbered List</option>
                          <option value="bullets">Bulleted List</option>
                        </>
                      )}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t p-4 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            <Info className="inline h-4 w-4 mr-1" />
            Configure data structures to handle multiple wallets and transactions in a single request
          </div>
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Structure</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataStructureDesigner;