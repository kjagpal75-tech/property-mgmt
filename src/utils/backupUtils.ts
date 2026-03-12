import { Property, Transaction } from '../types/property';

export interface BackupData {
  properties: Property[];
  transactions: Transaction[];
  exportDate: string;
  version: string;
}

export const exportData = (properties: Property[], transactions: Transaction[]): void => {
  const backupData: BackupData = {
    properties,
    transactions,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };

  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `property-management-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const data = JSON.parse(result) as BackupData;
          
          // Validate the imported data structure
          if (!data.properties || !data.transactions || !Array.isArray(data.properties) || !Array.isArray(data.transactions)) {
            throw new Error('Invalid backup file structure');
          }
          
          // Convert date strings back to Date objects
          data.properties = data.properties.map(p => ({
            ...p,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt)
          }));
          
          data.transactions = data.transactions.map(t => ({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt)
          }));
          
          resolve(data);
        } else {
          throw new Error('Invalid file content');
        }
      } catch (error) {
        reject(new Error('Failed to parse backup file: ' + (error as Error).message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

export const validateBackupFile = (file: File): boolean => {
  return file.type === 'application/json' || file.name.endsWith('.json');
};
