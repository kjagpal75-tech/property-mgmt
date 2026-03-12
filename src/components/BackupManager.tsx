import React, { useRef } from 'react';
import { Property, Transaction } from '../types/property';
import { exportData, importData, validateBackupFile, BackupData } from '../utils/backupUtils';

interface BackupManagerProps {
  properties: Property[];
  transactions: Transaction[];
  onImport: (data: BackupData) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ 
  properties, 
  transactions, 
  onImport 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (properties.length === 0 && transactions.length === 0) {
      alert('No data to export. Add some properties and transactions first.');
      return;
    }
    
    exportData(properties, transactions);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (!validateBackupFile(file)) {
      alert('Please select a valid JSON backup file.');
      return;
    }

    try {
      const data = await importData(file);
      
      if (window.confirm(
        `This will replace your current data with:\n` +
        `- ${data.properties.length} properties\n` +
        `- ${data.transactions.length} transactions\n\n` +
        `Do you want to continue?`
      )) {
        onImport(data);
        alert('Data imported successfully!');
      }
    } catch (error) {
      alert('Failed to import data: ' + (error as Error).message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Data Backup & Restore</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Export Data</h3>
          <p className="text-sm text-blue-700 mb-3">
            Download a backup of your properties and transactions to save externally.
          </p>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Backup
          </button>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-sm font-medium text-green-900 mb-2">Import Data</h3>
          <p className="text-sm text-green-700 mb-3">
            Restore your data from a previously created backup file.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={handleFileInputClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Backup
          </button>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">Important Notes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Export your data regularly to prevent loss</li>
            <li>• Store backup files in a safe location</li>
            <li>• Import will replace all current data</li>
            <li>• Backup files are saved as JSON format</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
