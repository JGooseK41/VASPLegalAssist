import React, { useState } from 'react';
import { Code, Copy, Check, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { showToast } from './Toast';

const SmartTagHelper = ({ onInsert, showPreview = true }) => {
  const [copiedTag, setCopiedTag] = useState(null);
  const [showFullList, setShowFullList] = useState(false);
  const [previewData, setPreviewData] = useState({
    VASP_NAME: 'Binance US',
    CASE_NUMBER: 'CASE-2024-001',
    AGENCY_NAME: 'Federal Bureau of Investigation',
    INVESTIGATOR_NAME: 'John Smith',
    DATE_TODAY: new Date().toLocaleDateString()
  });

  const smartTags = [
    {
      category: 'VASP Information',
      tags: [
        { tag: '{{VASP_NAME}}', description: 'Exchange or service name', example: 'Binance US' },
        { tag: '{{VASP_EMAIL}}', description: 'Compliance email address', example: 'compliance@binance.us' },
        { tag: '{{VASP_ADDRESS}}', description: 'Physical or legal address', example: '123 Crypto St, Suite 100' },
        { tag: '{{VASP_JURISDICTION}}', description: 'Legal jurisdiction', example: 'United States' }
      ]
    },
    {
      category: 'Case Information',
      tags: [
        { tag: '{{CASE_NUMBER}}', description: 'Your case reference', example: 'CASE-2024-001' },
        { tag: '{{CRIME_DESCRIPTION}}', description: 'Brief crime description', example: 'Wire fraud investigation' },
        { tag: '{{CASE_STATUTE}}', description: 'Relevant legal statute', example: '18 U.S.C. § 1343' },
        { tag: '{{DATE_TODAY}}', description: "Today's date", example: new Date().toLocaleDateString() },
        { tag: '{{DATE_DEADLINE}}', description: 'Response deadline (10 days)', example: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString() }
      ]
    },
    {
      category: 'Agency & Investigator',
      tags: [
        { tag: '{{AGENCY_NAME}}', description: 'Your agency name', example: 'Federal Bureau of Investigation' },
        { tag: '{{INVESTIGATOR_NAME}}', description: 'Your full name', example: 'John Smith' },
        { tag: '{{INVESTIGATOR_BADGE}}', description: 'Badge number', example: 'FBI-12345' },
        { tag: '{{INVESTIGATOR_TITLE}}', description: 'Your title/rank', example: 'Special Agent' }
      ]
    },
    {
      category: 'Transaction Data',
      tags: [
        { tag: '{{TRANSACTION_TABLE}}', description: 'Formatted transaction table', example: 'Auto-generated table' },
        { tag: '{{TRANSACTION_COUNT}}', description: 'Number of transactions', example: '5' },
        { tag: '{{#if transactions.[0]}}...{{/if}}', description: 'Conditional transaction block', example: 'Shows content if transactions exist' }
      ]
    }
  ];

  const handleCopy = (tag) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    showToast(`Copied ${tag} to clipboard`, 'success', 2000);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleInsert = (tag) => {
    if (onInsert) {
      onInsert(tag);
      showToast(`Inserted ${tag}`, 'success', 2000);
    } else {
      handleCopy(tag);
    }
  };

  const previewTag = (tag) => {
    const cleanTag = tag.replace(/{{|}}/g, '').replace(/#if.*\.|\/if/g, '');
    return previewData[cleanTag] || `[${cleanTag}]`;
  };

  const visibleCategories = showFullList ? smartTags : smartTags.slice(0, 2);

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <Code className="h-4 w-4 mr-2" />
          Smart Tag Reference
        </h3>
        <button
          onClick={() => setShowFullList(!showFullList)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showFullList ? 'Show Less' : 'Show All Tags'}
        </button>
      </div>

      <div className="space-y-4">
        {visibleCategories.map((category) => (
          <div key={category.category}>
            <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wider mb-2">
              {category.category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {category.tags.map((tagInfo) => (
                <div
                  key={tagInfo.tag}
                  className="bg-white rounded border border-gray-200 p-2 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs font-mono text-blue-600">{tagInfo.tag}</code>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleInsert(tagInfo.tag)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title={onInsert ? "Insert tag" : "Copy tag"}
                          >
                            {copiedTag === tagInfo.tag ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3 text-gray-400" />
                            )}
                          </button>
                          <div className="group relative">
                            <HelpCircle className="h-3 w-3 text-gray-400" />
                            <div className="absolute z-10 invisible group-hover:visible bg-gray-900 text-white text-xs rounded p-2 mt-1 w-48 -left-20">
                              {tagInfo.description}
                              <div className="text-gray-400 mt-1">
                                Example: {tagInfo.example}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {showPreview && (
                        <div className="text-xs text-gray-500 mt-1">
                          → <span className="text-gray-700">{previewTag(tagInfo.tag)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showPreview && (
        <div className="border-t pt-3">
          <button
            onClick={() => setShowPreview(false)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
          >
            <EyeOff className="h-3 w-3 mr-1" />
            Hide preview values
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-xs text-blue-800">
          <strong>Tip:</strong> Use conditional tags like <code className="font-mono bg-blue-100 px-1">{"{{#if statute}}...{{/if}}"}</code> to show content only when data exists.
        </p>
      </div>
    </div>
  );
};

export default SmartTagHelper;