import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Search, FileText, Globe, Users, Shield, AlertCircle, UserPlus, ArrowLeft, MessageSquare, TrendingUp, Award } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const FAQItem = ({ question, answer, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 px-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          {Icon && <Icon className="w-5 h-5 text-blue-600 mr-3" />}
          <span className="text-lg font-medium text-gray-900">{question}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <div className="text-gray-700 space-y-3">{answer}</div>
        </div>
      )}
    </div>
  );
};

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState(new Set([0, 1])); // First two sections expanded by default
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const toggleSection = (index) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };
  
  const faqSections = [
    {
      title: 'Getting Started',
      items: [
        {
          question: 'How do I register for an account?',
          answer: (
            <div>
              <p>To register for an account:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click the "Register" button on the login page</li>
                <li>Fill in your personal information (name, email, badge number)</li>
                <li>Enter your agency details</li>
                <li>Create a secure password</li>
                <li>Submit the form and wait for admin approval</li>
              </ol>
              <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                Note: New accounts require admin approval before you can access the system.
              </p>
            </div>
          ),
          icon: Users
        },
        {
          question: 'What happens after I register?',
          answer: (
            <div>
              <p>After registration:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your account will be pending approval</li>
                <li>An admin will review your registration details</li>
                <li>You'll receive an email once your account is approved</li>
                <li>After approval, you can log in and start using the system</li>
              </ul>
            </div>
          ),
          icon: Shield
        }
      ]
    },
    {
      title: 'Using the VASP Database',
      items: [
        {
          question: 'How do I search for a VASP?',
          answer: (
            <div>
              <p>To search for a VASP:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Navigate to "VASP Search" from the main menu</li>
                <li>Use the search bar to find VASPs by name, jurisdiction, or email</li>
                <li>Apply filters for jurisdiction, service method, or US service acceptance</li>
                <li>Click on a VASP card to view full details</li>
                <li>Use the "Select VASP" button to use it for document creation</li>
              </ol>
            </div>
          ),
          icon: Search
        },
        {
          question: 'What information is available for each VASP?',
          answer: (
            <div>
              <p>Each VASP card displays:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Legal name and operating name</li>
                <li>Jurisdiction and compliance contact email</li>
                <li>Processing time for requests</li>
                <li>Preferred method of service (email, portal, Kodex, etc.)</li>
                <li>Required documentation</li>
                <li>Types of information available</li>
                <li>Whether they accept US service</li>
                <li>Member comments and updates (expandable section)</li>
              </ul>
            </div>
          ),
          icon: Globe
        },
        {
          question: 'How do I add comments or updates about a VASP?',
          answer: (
            <div>
              <p>To add comments:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Find the VASP in the search results</li>
                <li>Click "Member Comments" at the bottom of the VASP card</li>
                <li>Type your comment in the text area</li>
                <li>Check "This is an update notification" if reporting changes</li>
                <li>Click the send button to post your comment</li>
              </ol>
              <p className="mt-2">Other members can upvote helpful comments to surface the best information.</p>
            </div>
          ),
          icon: Users
        }
      ]
    },
    {
      title: 'VASP Response Tracking - Community Intelligence',
      items: [
        {
          question: 'What is VASP Response Tracking and why should I participate?',
          answer: (
            <div>
              <h4 className="font-semibold mb-3 text-blue-900">🚀 Building Real-Time Compliance Intelligence Together</h4>
              
              <p className="mb-4">
                VASP Response Tracking is a <strong>groundbreaking community-driven feature</strong> that transforms how law enforcement 
                understands VASP compliance and responsiveness. By sharing your experiences, you're contributing to a 
                powerful collective intelligence system that benefits every crypto crime fighter in our network.
              </p>

              <div className="space-y-4">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Why This Matters:</h5>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><strong>Real Intelligence, Not Theory:</strong> See actual compliance rates based on real law enforcement experiences, not marketing claims</li>
                    <li><strong>Time is Critical:</strong> Know which VASPs respond in hours vs. weeks before you serve them</li>
                    <li><strong>Method Requirements:</strong> Learn if a VASP honors letterheads or demands MLATs - before wasting time</li>
                    <li><strong>Community Power:</strong> Every response you log helps thousands of investigators worldwide</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-500 p-4">
                  <h5 className="font-semibold text-green-900 mb-2">What You'll See on VASP Cards:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                        85% US Compliant
                      </span>
                      <span>- Instant visibility into actual compliance rates</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                        47 responses
                      </span>
                      <span>- Confidence in the data from peer experiences</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                        &lt;24 hours
                      </span>
                      <span>- Typical response time to set expectations</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <h5 className="font-semibold text-yellow-900 mb-2 flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Be a Community Hero
                  </h5>
                  <p className="text-sm">
                    This tool is <strong>YOUR tool</strong>. The more responses logged, the more powerful it becomes. 
                    You're not just using a database - you're building the most comprehensive VASP intelligence 
                    resource in law enforcement. Your contributions directly help solve crimes faster and more efficiently.
                  </p>
                </div>
              </div>
            </div>
          ),
          icon: TrendingUp
        },
        {
          question: 'How do I log a VASP response after serving documents?',
          answer: (
            <div>
              <p className="mb-3">Logging responses is quick and easy - it takes less than 30 seconds:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to "Document History" after serving your document</li>
                <li>Find the document you served</li>
                <li>Click the green <MessageSquare className="inline h-4 w-4 mx-1" /> "Log Response" button</li>
                <li>Answer a few quick questions:
                  <ul className="list-disc list-inside ml-6 mt-1 text-sm">
                    <li>Was the VASP US compliant? (Yes/No)</li>
                    <li>What did they require? (Letterhead, Subpoena, Search Warrant, MLAT)</li>
                    <li>How long did they take to respond?</li>
                  </ul>
                </li>
                <li>Click "Submit Response" - you're done!</li>
              </ol>
              
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-800">
                  <strong>🏆 Earn 5 Points!</strong> Each VASP response you log earns you 5 points on the leaderboard. 
                  Help the community and climb the rankings!
                </p>
              </div>
              
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Pro Tip:</strong> Log responses while they're fresh! Set a reminder to log the response 
                  as soon as you receive it from the VASP. Your fresh insights are most valuable to the community.
                </p>
              </div>
            </div>
          ),
          icon: MessageSquare
        },
        {
          question: 'What information is collected and how is it displayed?',
          answer: (
            <div>
              <h5 className="font-semibold mb-3">Information Collected:</h5>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li><strong>US Compliance:</strong> Whether they honored your US legal process</li>
                <li><strong>Method Requirements:</strong> What level of legal process they demanded
                  <ul className="list-disc list-inside ml-6 text-sm mt-1">
                    <li>Letterhead (fastest)</li>
                    <li>Subpoena</li>
                    <li>Search Warrant</li>
                    <li>MLAT (slowest)</li>
                  </ul>
                </li>
                <li><strong>Response Time:</strong> How quickly they provided the requested data</li>
                <li><strong>Additional Notes:</strong> Optional field for special circumstances</li>
              </ul>

              <h5 className="font-semibold mb-3">How It's Displayed:</h5>
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium mb-2">On VASP Cards:</p>
                  <p className="text-sm">Smart badges show key metrics at a glance. Click any badge to see detailed statistics including method breakdowns and response time distributions.</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded">
                  <p className="font-medium mb-2">Privacy Protected:</p>
                  <p className="text-sm">All data is aggregated and anonymized. Individual responses are never shown - only community averages and totals.</p>
                </div>
              </div>
            </div>
          ),
          icon: Shield
        },
        {
          question: 'How does this help me with my investigations?',
          answer: (
            <div>
              <h5 className="font-semibold mb-3">Real-World Benefits for Your Cases:</h5>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-2xl mr-3">⚡</span>
                  <div>
                    <h6 className="font-medium">Faster Case Resolution</h6>
                    <p className="text-sm text-gray-600">Know which VASPs respond in hours vs. weeks. Prioritize fast responders for time-sensitive cases.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="text-2xl mr-3">📋</span>
                  <div>
                    <h6 className="font-medium">Proper Documentation</h6>
                    <p className="text-sm text-gray-600">Don't waste time sending letterheads to VASPs that require search warrants. Get it right the first time.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🎯</span>
                  <div>
                    <h6 className="font-medium">Strategic Planning</h6>
                    <p className="text-sm text-gray-600">If a VASP shows 20% compliance or typically requires MLATs, you can plan accordingly and set realistic timelines.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="text-2xl mr-3">🤝</span>
                  <div>
                    <h6 className="font-medium">Negotiation Power</h6>
                    <p className="text-sm text-gray-600">When a VASP claims they "always require MLATs," you can see if other agencies succeeded with subpoenas.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-800">
                  <strong>Example:</strong> You see Exchange X has 95% US compliance, typically honors letterheads, 
                  and responds within 24 hours based on 50+ law enforcement responses. You can confidently proceed 
                  knowing you'll likely get quick results with minimal documentation.
                </p>
              </div>
            </div>
          ),
          icon: TrendingUp
        },
        {
          question: 'Why should I take time to log responses?',
          answer: (
            <div>
              <h5 className="font-semibold mb-3 text-blue-900">You're Building Something Revolutionary</h5>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                  <h6 className="font-semibold text-blue-900 mb-2">This is YOUR Database</h6>
                  <p className="text-sm">
                    Traditional databases show what VASPs claim they'll do. This shows what they ACTUALLY do when 
                    served by real law enforcement. You're creating the first-ever crowdsourced VASP compliance 
                    intelligence platform built by and for crypto crime fighters.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium">Every response you log:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Saves hours for another investigator who won't chase dead ends</li>
                    <li>Builds pressure on non-compliant VASPs when data shows poor performance</li>
                    <li>Rewards good VASPs with positive statistics that encourage cooperation</li>
                    <li>Creates an undeniable record of VASP behavior patterns</li>
                    <li>Strengthens our entire community's effectiveness</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    🏆 Join the Elite Crypto Crime Fighters
                  </p>
                  <p className="text-sm text-yellow-800">
                    Agencies that actively log responses are the backbone of this community. They don't just 
                    solve their own cases - they lift up every investigator in the network. Be part of the 
                    solution. Be a leader in the fight against crypto crime.
                  </p>
                </div>
                
                <div className="text-center p-4 bg-gray-900 text-white rounded-lg">
                  <p className="font-bold">
                    "If every investigator logs just one response per month, we'll have the most powerful 
                    VASP intelligence tool in existence within 90 days."
                  </p>
                  <p className="text-sm mt-2 text-gray-300">
                    - The power is in your hands
                  </p>
                </div>
              </div>
            </div>
          ),
          icon: Award
        }
      ]
    },
    {
      title: 'Creating Legal Documents',
      items: [
        {
          question: 'How do I create a new legal document?',
          answer: (
            <div>
              <p>To create a document:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Search and select a VASP first</li>
                <li>Click "Create New Document" or select the VASP</li>
                <li>Choose your document template</li>
                <li>Fill in case information (case number, crime description, statute)</li>
                <li>Add transaction details if applicable</li>
                <li>Select the information types you're requesting</li>
                <li>Choose output format (PDF or Word)</li>
                <li>Click "Generate Document"</li>
              </ol>
            </div>
          ),
          icon: FileText
        },
        {
          question: 'Can I import transaction data from CSV?',
          answer: (
            <div>
              <p>Yes! To import transactions:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Prepare your CSV with columns: Date, Type, Amount, From, To, Hash</li>
                <li>In the document builder, click "Import from CSV"</li>
                <li>Select your CSV file</li>
                <li>Review the imported transactions</li>
                <li>Edit or remove any transactions as needed</li>
              </ol>
              <p className="mt-2 text-sm text-blue-700 bg-blue-50 p-3 rounded">
                Tip: You can also manually add transactions one by one if you prefer.
              </p>
            </div>
          ),
          icon: FileText
        }
      ]
    },
    {
      title: 'Templates and Customization',
      items: [
        {
          question: 'How do I customize document templates?',
          answer: (
            <div>
              <p>To customize templates:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to "Template Manager" from the main menu</li>
                <li>Create a new template or edit an existing one</li>
                <li>Customize agency header, address, and contact info</li>
                <li>Modify footer text and signature block</li>
                <li>Set as default for specific document types</li>
              </ol>
            </div>
          ),
          icon: FileText
        },
        {
          question: 'Can I upload my own Word templates?',
          answer: (
            <div>
              <p>Yes! Smart template upload allows you to:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Upload existing Word (.docx) templates</li>
                <li>The system will detect placeholders like {`{{case_number}}`}</li>
                <li>Map detected markers to system fields</li>
                <li>Use your custom template for document generation</li>
              </ol>
              <p className="mt-2">Supported placeholders include: case_number, vasp_name, crime_description, and more.</p>
            </div>
          ),
          icon: FileText
        },
        {
          question: 'How do I create a custom agency template/subpoena with smart placeholders?',
          answer: (
            <div>
              <h4 className="font-semibold mb-3">Step-by-Step Guide to Creating Smart Templates</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Step 1: Create Your Word Document</h5>
                  <ol className="list-decimal list-inside ml-4 space-y-1 text-sm">
                    <li>Open Microsoft Word or any DOCX-compatible editor</li>
                    <li>Create your document with all your standard legal language and formatting</li>
                    <li>Leave placeholders where variable information will be inserted</li>
                    <li>Save as a .docx file (not .doc or PDF)</li>
                  </ol>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Step 2: Add Smart Placeholders</h5>
                  <p className="text-sm mb-2">Replace variable text with these exact placeholders (including double curly braces):</p>
                  <div className="bg-gray-100 p-3 rounded-md space-y-2 text-sm font-mono">
                    <div><span className="text-blue-600">{`{{vasp_name}}`}</span> - VASP's display name</div>
                    <div><span className="text-blue-600">{`{{vasp_legal_name}}`}</span> - VASP's legal entity name</div>
                    <div><span className="text-blue-600">{`{{vasp_email}}`}</span> - VASP compliance email</div>
                    <div><span className="text-blue-600">{`{{case_number}}`}</span> - Your case number</div>
                    <div><span className="text-blue-600">{`{{statute}}`}</span> - Legal statute/code</div>
                    <div><span className="text-blue-600">{`{{crime_description}}`}</span> - Description of criminal activity</div>
                    <div><span className="text-blue-600">{`{{transaction_id}}`}</span> - Cryptocurrency transaction ID</div>
                    <div><span className="text-blue-600">{`{{from_address}}`}</span> - Sending wallet address</div>
                    <div><span className="text-blue-600">{`{{to_address}}`}</span> - Receiving wallet address</div>
                    <div><span className="text-blue-600">{`{{amount}}`}</span> - Transaction amount</div>
                    <div><span className="text-blue-600">{`{{currency}}`}</span> - Cryptocurrency type</div>
                    <div><span className="text-blue-600">{`{{date}}`}</span> - Transaction date</div>
                    <div><span className="text-blue-600">{`{{current_date}}`}</span> - Today's date</div>
                    <div><span className="text-blue-600">{`{{agency_name}}`}</span> - Your agency name</div>
                    <div><span className="text-blue-600">{`{{agent_name}}`}</span> - Your name</div>
                    <div><span className="text-blue-600">{`{{agent_title}}`}</span> - Your title</div>
                    <div><span className="text-blue-600">{`{{badge_number}}`}</span> - Your badge number</div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Step 3: Example Template Structure</h5>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-md text-sm">
                    <div className="whitespace-pre-line font-mono text-xs">
{`UNITED STATES DISTRICT COURT
FOR THE [DISTRICT NAME]

SUBPOENA TO {{vasp_name}}

Case Number: {{case_number}}

TO: {{vasp_legal_name}}
    {{vasp_email}}

YOU ARE COMMANDED to produce the following records related to the investigation of {{crime_description}} under {{statute}}:

1. Complete KYC information for the following cryptocurrency transactions:
   Transaction ID: {{transaction_id}}
   From: {{from_address}}
   To: {{to_address}}
   Amount: {{amount}} {{currency}}
   Date: {{date}}

2. All account records and transaction history associated with the above addresses.

This subpoena is issued on {{current_date}} by:

{{agent_name}}
{{agent_title}}
Badge #{{badge_number}}
{{agency_name}}`}
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Step 4: Upload Your Template</h5>
                  <ol className="list-decimal list-inside ml-4 space-y-1 text-sm">
                    <li>Go to "Templates" in the navigation</li>
                    <li>Click "Upload Smart Template"</li>
                    <li>Select your .docx file</li>
                    <li>Give your template a descriptive name</li>
                    <li>Select the document type (Subpoena, Freeze Request, etc.)</li>
                    <li>The system will detect all your placeholders</li>
                    <li>Configure any custom field mappings if needed</li>
                    <li>Save your template</li>
                  </ol>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Step 5: Using Your Template</h5>
                  <ol className="list-decimal list-inside ml-4 space-y-1 text-sm">
                    <li>Go to "Generate Document"</li>
                    <li>Select your VASP</li>
                    <li>Choose your custom template from the dropdown</li>
                    <li>Fill in the case information and transaction details</li>
                    <li>Generate your document - all placeholders will be replaced automatically</li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                  <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Best Practices
                  </h5>
                  <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    <li>Always use double curly braces {`{{ }}`} for placeholders</li>
                    <li>Don't add spaces inside the braces: {`{{correct}}`} not {`{{ incorrect }}`}</li>
                    <li>Use exact placeholder names from the list above</li>
                    <li>Test your template with sample data first</li>
                    <li>Keep a backup of your original template</li>
                    <li>For multiple transactions, the system will duplicate transaction sections automatically</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h5 className="font-medium text-yellow-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Custom Fields
                  </h5>
                  <p className="text-sm text-yellow-800">
                    If you need placeholders that aren't in the standard list, you can still use them! 
                    The system will detect them as "custom fields" and allow you to map them to data 
                    or fill them in manually during document creation.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h5 className="font-medium text-green-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Omitting Placeholders
                  </h5>
                  <p className="text-sm text-green-800">
                    You don't have to use all available placeholders in your template. The system will:
                  </p>
                  <ul className="list-disc list-inside text-sm text-green-800 mt-2 space-y-1">
                    <li>Only replace placeholders that exist in your template</li>
                    <li>Ignore any data fields that don't have corresponding placeholders</li>
                    <li>Leave any unmatched placeholders as-is if the data is not provided</li>
                  </ul>
                  <p className="text-sm text-green-800 mt-2">
                    This allows you to create simplified templates that only include the fields you need.
                  </p>
                </div>
              </div>
            </div>
          ),
          icon: FileText
        }
      ]
    },
    {
      title: 'Submitting New VASPs',
      items: [
        {
          question: 'How do I submit information about a new VASP?',
          answer: (
            <div>
              <p>To submit a new VASP:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Click "Submit New VASP" from the main menu</li>
                <li>Fill in all required information about the VASP</li>
                <li>Include compliance contact details</li>
                <li>Specify their preferred service method</li>
                <li>Add any relevant notes or special instructions</li>
                <li>Submit for admin review</li>
              </ol>
              <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                Note: All VASP submissions require admin approval before being added to the database.
              </p>
            </div>
          ),
          icon: Globe
        },
        {
          question: 'What happens after I submit a VASP?',
          answer: (
            <div>
              <p>After submission:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Your submission enters a pending state</li>
                <li>An admin will review the information</li>
                <li>They may approve it (creating the VASP) or reject it with feedback</li>
                <li>You can view your submission status in "My Submissions"</li>
                <li>You can edit pending submissions until they're reviewed</li>
              </ul>
            </div>
          ),
          icon: Shield
        }
      ]
    },
    {
      title: 'Security & Privacy',
      items: [
        {
          question: 'How secure is my investigation data and custom templates?',
          answer: (
            <div>
              <p className="mb-3">Your data is protected with military-grade encryption:</p>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">🔐 Custom Templates</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your custom agency templates and subpoenas with logos are encrypted</li>
                    <li>Only you can view or use your templates - they're invisible to everyone else</li>
                    <li>Even site administrators and the site owner cannot access your templates</li>
                    <li>Templates remain encrypted at rest in the database</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">📄 Generated Documents</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>All generated letterheads, subpoenas, and search warrants are encrypted</li>
                    <li>Documents are encrypted at rest in the database</li>
                    <li>Downloads are protected during transit with HTTPS encryption</li>
                    <li>Investigation details cannot be viewed by anyone except you</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">🛡️ Zero-Knowledge Architecture</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Each user has a unique encryption key derived from their account</li>
                    <li>Your data is encrypted with AES-256-GCM (military-grade encryption)</li>
                    <li>Even with database access, your data remains unreadable without your key</li>
                    <li>We cannot recover your data if you lose access to your account</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Bottom Line:</strong> Your investigations, templates, and generated documents 
                    are completely private. No one - not administrators, not the site owner, not even someone 
                    with direct database access - can view your sensitive data. Only you have the key.
                  </p>
                </div>
              </div>
            </div>
          ),
          icon: Shield
        },
        {
          question: 'What happens to my encrypted data if I forget my password?',
          answer: (
            <div>
              <p>If you reset your password:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You'll regain access to your account through email verification</li>
                <li>Your encryption key is derived from your user ID (not your password)</li>
                <li>All your encrypted templates and documents remain accessible</li>
                <li>Your data stays secure throughout the password reset process</li>
              </ul>
              <p className="mt-3 text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
                Note: If your account is deleted, your encrypted data becomes permanently inaccessible 
                as the encryption key is destroyed with your account.
              </p>
            </div>
          ),
          icon: Shield
        },
        {
          question: 'Can law enforcement agencies request access to my data?',
          answer: (
            <div>
              <p>Due to our encryption architecture:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>We cannot decrypt or access your templates and documents</li>
                <li>Each user's data is encrypted with their unique key</li>
                <li>We can only provide encrypted data, which is useless without your key</li>
                <li>This protects the confidentiality of ongoing investigations</li>
              </ul>
              <p className="mt-3">
                This design ensures that sensitive investigation details remain confidential 
                and cannot be compromised, even under legal compulsion.
              </p>
            </div>
          ),
          icon: Shield
        }
      ]
    },
    {
      title: 'Admin Features',
      items: [
        {
          question: 'What can admins do?',
          answer: (
            <div>
              <p>Admin users have access to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Admin Portal with dashboard statistics</li>
                <li>User management - approve/reject new users</li>
                <li>VASP management - add, edit, or deactivate VASPs</li>
                <li>Review and approve VASP submissions</li>
                <li>Manage user roles and permissions</li>
                <li>View system-wide activity and statistics</li>
              </ul>
            </div>
          ),
          icon: Shield
        },
        {
          question: 'How do I access the admin portal?',
          answer: (
            <div>
              <p>If you have admin privileges:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Look for the "Admin Portal" link in the navigation menu</li>
                <li>Click to enter the admin interface</li>
                <li>Use the sidebar to navigate between admin sections</li>
                <li>Return to the main app using the back link</li>
              </ol>
              <p className="mt-2 text-sm text-blue-700 bg-blue-50 p-3 rounded">
                Admin access is restricted to authorized personnel only.
              </p>
            </div>
          ),
          icon: Shield
        }
      ]
    }
  ];
  
  // Filter FAQ items based on search
  const filteredSections = faqSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof item.answer === 'string' && item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(section => section.items.length > 0);
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Navigation buttons */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </button>
        
        {!user && (
          <Link
            to="/register"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Register for Access
          </Link>
        )}
      </div>

      <div className="text-center mb-8">
        <HelpCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="mt-2 text-lg text-gray-600">
          Learn how to use the VASP Legal Assistant effectively
        </p>
      </div>
      
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs..."
            className="pl-10 block w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* FAQ Sections */}
      <div className="space-y-8">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No FAQs found matching your search.</p>
          </div>
        ) : (
          filteredSections.map((section, index) => {
            const originalIndex = faqSections.findIndex(s => s.title === section.title);
            const isExpanded = expandedSections.has(originalIndex);
            
            return (
              <div key={index} className="bg-white shadow rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(originalIndex)}
                  className="w-full bg-blue-600 px-6 py-4 flex items-center justify-between hover:bg-blue-700 transition-colors"
                >
                  <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                  <div className="flex items-center text-white">
                    <span className="text-sm mr-2">{section.items.length} questions</span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="divide-y divide-gray-200">
                    {section.items.map((item, itemIndex) => (
                      <FAQItem key={itemIndex} {...item} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Contact Support */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          Still have questions?
        </h3>
        <p className="text-blue-700">
          Contact your system administrator or submit a support ticket for additional help.
        </p>
      </div>
    </div>
  );
};

export default FAQ;