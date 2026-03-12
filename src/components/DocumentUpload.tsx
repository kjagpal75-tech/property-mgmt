import React, { useState, useCallback } from 'react';
import { Property, Transaction, TransactionCategory } from '../types/property';

interface DocumentUploadProps {
  properties: Property[];
  onTransactionExtracted: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
}

interface ExtractedTransaction {
  amount: number;
  date: string;
  description: string;
  category: TransactionCategory;
  type: 'income' | 'expense';
  propertyId: string;
  confidence: number;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ properties, onTransactionExtracted }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedTransaction | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }

      // Extract text using OCR
      const extractedText = await extractTextFromDocument(file);
      setExtractedText(extractedText);
      
      // Don't auto-extract transaction yet - wait for user to assign property
      setExtractedData(null);
      setSelectedPropertyId('');
      
    } catch (error) {
      console.error('Error processing document:', error);
      alert('Failed to process document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const extractTextFromDocument = async (file: File): Promise<string> => {
    // For now, we'll use a simple text extraction simulation
    // In a real implementation, you'd use Tesseract.js or a server-side OCR service
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate OCR extraction with common receipt patterns
        const mockTexts = [
          "HOME DEPOT\n123 MAIN ST\n03/15/2024\nTOTAL: $127.43\nTAX: $10.19\nCREDIT CARD ****1234",
          "RENT PAYMENT\nFREMONT RENTAL\n03/01/2024\nAMOUNT: $2100.00\nPAID VIA ZELLE",
          "PG&E\nUTILITY BILL\n03/10/2024\nTOTAL DUE: $156.78\nACCOUNT: 123456789",
          "INSURANCE PREMIUM\nSTATE FARM\n03/05/2024\nPREMIUM: $89.50\nPOLICY: ABC123456"
        ];
        
        // Try to detect content based on file name or random selection
        const fileName = file.name.toLowerCase();
        let selectedText = mockTexts[0]; // default
        
        if (fileName.includes('rent') || fileName.includes('payment')) {
          selectedText = mockTexts[1];
        } else if (fileName.includes('utility') || fileName.includes('pg&e')) {
          selectedText = mockTexts[2];
        } else if (fileName.includes('insurance')) {
          selectedText = mockTexts[3];
        } else {
          selectedText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
        }
        
        resolve(selectedText);
      }, 2000); // Simulate processing time
    });
  };

  const parseTransactionFromText = (text: string, selectedPropertyId?: string): ExtractedTransaction | null => {
    const lines = text.split('\n');
    const upperText = text.toUpperCase();
    
    // Extract amount
    let amount = 0;
    const amountMatch = text.match(/\$[\d,]+\.?\d*/);
    if (amountMatch) {
      amount = parseFloat(amountMatch[0].replace('$', '').replace(',', ''));
    }

    // Extract date
    let date = new Date().toISOString().split('T')[0];
    const dateMatch = text.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    if (dateMatch) {
      date = dateMatch[0];
    }

    // Determine category and type based on keywords
    let category: TransactionCategory = 'other';
    let type: 'income' | 'expense' = 'expense';
    let description = '';
    let suggestedPropertyId = '';

    if (upperText.includes('RENT') || upperText.includes('PAYMENT')) {
      category = 'rent';
      type = 'income';
      description = 'Rent payment';
      // Try to find property from rent description
      const propertyMatch = text.match(/(?:RENT|PAYMENT)\s+(.+?)(?:\n|$)/i);
      if (propertyMatch) {
        const propertyName = propertyMatch[1].trim();
        const foundProperty = properties.find(p => 
          p.name.toUpperCase().includes(propertyName.toUpperCase()) ||
          propertyName.toUpperCase().includes(p.name.toUpperCase())
        );
        if (foundProperty) {
          suggestedPropertyId = foundProperty.id;
        }
      }
    } else if (upperText.includes('HOME DEPOT') || upperText.includes('LOWE') || upperText.includes('MAINTENANCE')) {
      category = 'maintenance';
      description = 'Maintenance/Repairs';
    } else if (upperText.includes('UTILITY') || upperText.includes('PG&E') || upperText.includes('ELECTRIC')) {
      category = 'utilities';
      description = 'Utilities';
    } else if (upperText.includes('INSURANCE')) {
      category = 'insurance';
      description = 'Insurance premium';
    } else if (upperText.includes('TAX')) {
      category = 'property_tax';
      description = 'Property tax';
    } else {
      // Extract merchant name as description
      const merchantMatch = text.match(/^([A-Z\s&]+)$/m);
      if (merchantMatch) {
        description = merchantMatch[1].trim();
      } else {
        description = 'Other expense';
      }
    }

    // Smart property assignment logic
    if (selectedPropertyId) {
      // Use the user-selected property
      suggestedPropertyId = selectedPropertyId;
    } else {
      // Fallback to original logic
      if (!suggestedPropertyId) {
        if (properties.length === 1) {
          // If only one property, assign to it
          suggestedPropertyId = properties[0].id;
        } else if (properties.length > 1) {
          // For multiple properties, try to make an educated guess
          const propertyKeywords = [
            { keywords: ['FREMONT', 'FREMONT RENTAL'], propertyId: properties.find(p => p.name.toUpperCase().includes('FREMONT'))?.id },
            { keywords: ['TRUCKEE', 'TRUCKEE RENTAL'], propertyId: properties.find(p => p.name.toUpperCase().includes('TRUCKEE'))?.id },
          ];
          
          for (const { keywords, propertyId } of propertyKeywords) {
            if (propertyId && keywords.some(keyword => upperText.includes(keyword))) {
              suggestedPropertyId = propertyId;
              break;
            }
          }
        }
      }

      // Default to first property if no match found
      if (!suggestedPropertyId && properties.length > 0) {
        suggestedPropertyId = properties[0].id;
      }
    }

    return {
      amount,
      date,
      description,
      category,
      type,
      propertyId: suggestedPropertyId,
      confidence: 0.85 // Mock confidence score
    };
  };

  const handlePropertyAssignment = () => {
    if (!selectedPropertyId) {
      alert('Please select a property for this transaction.');
      return;
    }
    
    // Now extract transaction details with the selected property
    const transactionData = parseTransactionFromText(extractedText, selectedPropertyId);
    
    if (transactionData) {
      setExtractedData(transactionData);
    }
  };

  const handleReset = () => {
    setExtractedData(null);
    setPreviewUrl(null);
    setSelectedPropertyId('');
    setExtractedText('');
  };

  const handleAcceptTransaction = () => {
    if (extractedData) {
      onTransactionExtracted({
        propertyId: extractedData.propertyId,
        type: extractedData.type,
        category: extractedData.category,
        amount: extractedData.amount,
        description: extractedData.description,
        date: new Date(extractedData.date)
      });
      
      // Reset form
      handleReset();
    }
  };

  const handleRejectTransaction = () => {
    setExtractedData(null);
  };

  const handlePropertyChange = (propertyId: string) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, propertyId });
    }
  };

  const handleCategoryChange = (category: TransactionCategory) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, category });
    }
  };

  const handleAmountChange = (amount: string) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, amount: parseFloat(amount) || 0 });
    }
  };

  const handleDescriptionChange = (description: string) => {
    if (extractedData) {
      setExtractedData({ ...extractedData, description });
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Import Receipt/Document</h2>
      
      {!previewUrl ? (
        <div>
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isProcessing ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600">Processing document...</p>
                <p className="text-sm text-gray-500">Extracting text from document</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600">Drag and drop a receipt or document here</p>
                  <p className="text-sm text-gray-500 mt-1">or</p>
                </div>
                <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
                  Select File
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                  />
                </label>
                <p className="text-xs text-gray-500">Supports images and PDF files</p>
              </div>
            )}
          </div>
        </div>
      ) : !extractedData ? (
        /* Property Assignment Step */
        <div className="space-y-6">
          {previewUrl && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Document Preview</h3>
              <img src={previewUrl} alt="Document preview" className="max-w-full h-auto rounded" />
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Assign Property</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which property is this document for?
                </label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  💡 Documents don't contain property information, so please assign it manually.
                </p>
              </div>

              <div className="bg-white border rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Text Preview:</h4>
                <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{extractedText}</pre>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                onClick={handlePropertyAssignment}
                disabled={!selectedPropertyId}
                className={`flex-1 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  selectedPropertyId
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue to Transaction Details
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Extracted Data Review */
        <div className="space-y-6">
          {previewUrl && (
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Document Preview</h3>
              <img src={previewUrl} alt="Document preview" className="max-w-full h-auto rounded" />
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Extracted Transaction Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Property 
                  {extractedData.propertyId && (
                    <span className="ml-2 text-xs text-gray-500">
                      (Auto-assigned from document content)
                    </span>
                  )}
                </label>
                <select
                  value={extractedData.propertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a property</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                {properties.length > 1 && (
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Documents don't contain property info - please verify the assignment
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <div className="flex items-center space-x-4 pt-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="income"
                      checked={extractedData.type === 'income'}
                      onChange={() => setExtractedData({ ...extractedData, type: 'income' })}
                      className="mr-2"
                    />
                    Income
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="expense"
                      checked={extractedData.type === 'expense'}
                      onChange={() => setExtractedData({ ...extractedData, type: 'expense' })}
                      className="mr-2"
                    />
                    Expense
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={extractedData.category}
                  onChange={(e) => handleCategoryChange(e.target.value as TransactionCategory)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rent">Rent</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="insurance">Insurance</option>
                  <option value="property_tax">Property Tax</option>
                  <option value="utilities">Utilities</option>
                  <option value="management_fees">Management Fees</option>
                  <option value="vacancy">Vacancy</option>
                  <option value="repairs">Repairs</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={extractedData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  step="0.01"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={extractedData.date}
                  onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={extractedData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Confidence:</span> {Math.round(extractedData.confidence * 100)}%
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleAcceptTransaction}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Accept & Create Transaction
            </button>
            <button
              onClick={handleRejectTransaction}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
