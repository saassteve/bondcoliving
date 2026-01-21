import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { storageService } from '../../lib/services/storage';

interface MigrationResult {
  table: string;
  record_id: string;
  old_url: string;
  new_url?: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

const AdminImageMigrationPage: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [scanResults, setScanResults] = useState<{ table: string; count: number; urls: Array<{ id: string; url: string; field: string }> }[]>([]);
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const tablesToScan = [
    { table: 'apartments', field: 'image_url', idField: 'id' },
    { table: 'apartment_images', field: 'image_url', idField: 'id' },
    { table: 'buildings', field: 'image_url', idField: 'id' },
    { table: 'buildings', field: 'gallery_images', idField: 'id' },
    { table: 'events', field: 'image_url', idField: 'id' },
    { table: 'coworking_images', field: 'image_url', idField: 'id' },
  ];

  const isCDNUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('ucarecdn.com') ||
           url.includes('pexels.com') ||
           url.includes('pravatar.cc') ||
           url.includes('transparenttextures.com') ||
           (!storageService.isSupabaseUrl(url) && (url.startsWith('http://') || url.startsWith('https://')));
  };

  const scanForCDNImages = async () => {
    setIsScanning(true);
    setScanResults([]);

    try {
      const results = [];

      for (const { table, field, idField } of tablesToScan) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select(`${idField}, ${field}`);

          if (error) {
            console.error(`Error scanning ${table}:`, error);
            continue;
          }

          const cdnUrls = (data || [])
            .filter((row: any) => {
              const value = row[field];
              if (Array.isArray(value)) {
                return value.some((url: string) => isCDNUrl(url));
              }
              return isCDNUrl(value);
            })
            .map((row: any) => ({
              id: row[idField],
              url: row[field],
              field: field,
            }));

          if (cdnUrls.length > 0) {
            results.push({
              table,
              count: cdnUrls.length,
              urls: cdnUrls,
            });
          }
        } catch (err) {
          console.error(`Error processing ${table}:`, err);
        }
      }

      setScanResults(results);
    } catch (error) {
      console.error('Error during scan:', error);
      alert('Failed to scan for CDN images');
    } finally {
      setIsScanning(false);
    }
  };

  const downloadAndUploadImage = async (url: string, folder: string): Promise<string> => {
    // Download the image
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const blob = await response.blob();
    const filename = url.split('/').pop() || 'image.jpg';
    const file = new File([blob], filename, { type: blob.type });

    // Upload to Supabase storage
    const result = await storageService.uploadImage(file, folder as any);
    return result.url;
  };

  const migrateImages = async () => {
    if (!window.confirm('This will migrate all CDN images to Supabase storage. This action cannot be undone. Continue?')) {
      return;
    }

    setIsMigrating(true);
    setMigrationResults([]);

    const allUrls = scanResults.flatMap((result) =>
      result.urls.map((urlData) => ({
        table: result.table,
        ...urlData,
      }))
    );

    setProgress({ current: 0, total: allUrls.length });

    for (let i = 0; i < allUrls.length; i++) {
      const { table, id, url, field } = allUrls[i];

      try {
        // Skip if already a Supabase URL
        if (storageService.isSupabaseUrl(url)) {
          setMigrationResults((prev) => [
            ...prev,
            {
              table,
              record_id: id,
              old_url: url,
              status: 'skipped',
              error: 'Already using Supabase storage',
            },
          ]);
          setProgress((prev) => ({ ...prev, current: i + 1 }));
          continue;
        }

        // Determine folder based on table
        let folder = 'apartments';
        if (table.includes('building')) folder = 'buildings';
        else if (table.includes('event')) folder = 'events';
        else if (table.includes('coworking')) folder = 'coworking';

        // Handle array fields (like gallery_images)
        if (Array.isArray(url)) {
          const newUrls = [];
          for (const singleUrl of url) {
            if (isCDNUrl(singleUrl)) {
              try {
                const newUrl = await downloadAndUploadImage(singleUrl, folder);
                newUrls.push(newUrl);
              } catch (err) {
                newUrls.push(singleUrl); // Keep old URL if migration fails
              }
            } else {
              newUrls.push(singleUrl);
            }
          }

          await supabase
            .from(table)
            .update({ [field]: newUrls })
            .eq('id', id);

          setMigrationResults((prev) => [
            ...prev,
            {
              table,
              record_id: id,
              old_url: url.join(', '),
              new_url: newUrls.join(', '),
              status: 'success',
            },
          ]);
        } else {
          // Single URL field
          const newUrl = await downloadAndUploadImage(url, folder);

          await supabase
            .from(table)
            .update({ [field]: newUrl })
            .eq('id', id);

          setMigrationResults((prev) => [
            ...prev,
            {
              table,
              record_id: id,
              old_url: url,
              new_url: newUrl,
              status: 'success',
            },
          ]);
        }
      } catch (error) {
        console.error(`Failed to migrate ${url}:`, error);
        setMigrationResults((prev) => [
          ...prev,
          {
            table,
            record_id: id,
            old_url: Array.isArray(url) ? url.join(', ') : url,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        ]);
      }

      setProgress((prev) => ({ ...prev, current: i + 1 }));
    }

    setIsMigrating(false);
    alert('Migration complete! Check the results below.');
  };

  const totalCDNImages = scanResults.reduce((sum, result) => sum + result.count, 0);
  const successCount = migrationResults.filter((r) => r.status === 'success').length;
  const failedCount = migrationResults.filter((r) => r.status === 'failed').length;
  const skippedCount = migrationResults.filter((r) => r.status === 'skipped').length;

  return (
    <>
      <Helmet>
        <title>Image Migration - Bond Admin</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">CDN Image Migration</h1>
          <p className="text-gray-300">
            Migrate all external CDN images to Supabase storage
          </p>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-yellow-300 font-medium mb-1">Important Notice</h3>
              <p className="text-yellow-400 text-sm">
                This tool will download all CDN-hosted images and upload them to Supabase storage.
                The database records will be updated with new storage URLs. This process is irreversible.
                Make sure you have a database backup before proceeding.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Step 1: Scan for CDN Images</h2>
          <p className="text-gray-300 mb-4">
            Scan the database to find all images hosted on external CDNs (ucarecdn.com, pexels.com, etc.)
          </p>
          <button
            onClick={scanForCDNImages}
            disabled={isScanning || isMigrating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Scan Database
              </>
            )}
          </button>
        </div>

        {scanResults.length > 0 && (
          <>
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Scan Results</h2>
              <div className="mb-6">
                <div className="text-3xl font-bold text-white mb-2">{totalCDNImages}</div>
                <div className="text-gray-300">CDN images found across {scanResults.length} tables</div>
              </div>

              <div className="space-y-4">
                {scanResults.map((result) => (
                  <div key={result.table} className="border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{result.table}</h3>
                      <span className="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-sm">
                        {result.count} images
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {result.urls.slice(0, 3).map((urlData, idx) => (
                        <div key={idx} className="truncate mb-1">
                          {Array.isArray(urlData.url)
                            ? `${urlData.url.length} gallery images`
                            : urlData.url}
                        </div>
                      ))}
                      {result.urls.length > 3 && (
                        <div className="text-gray-500">+ {result.urls.length - 3} more</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
              <h2 className="text-lg font-bold text-white mb-4">Step 2: Migrate Images</h2>
              <p className="text-gray-300 mb-4">
                Download all CDN images and upload them to Supabase storage. Database records will be
                updated automatically.
              </p>
              <button
                onClick={migrateImages}
                disabled={isScanning || isMigrating}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isMigrating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Migrating... ({progress.current}/{progress.total})
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Start Migration
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {migrationResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
            <h2 className="text-lg font-bold text-white mb-4">Migration Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-300 font-medium">Success</span>
                </div>
                <div className="text-2xl font-bold text-white">{successCount}</div>
              </div>
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-300 font-medium">Failed</span>
                </div>
                <div className="text-2xl font-bold text-white">{failedCount}</div>
              </div>
              <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300 font-medium">Skipped</span>
                </div>
                <div className="text-2xl font-bold text-white">{skippedCount}</div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {migrationResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`border rounded p-3 text-sm ${
                    result.status === 'success'
                      ? 'border-green-700 bg-green-900/10'
                      : result.status === 'failed'
                      ? 'border-red-700 bg-red-900/10'
                      : 'border-gray-600 bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {result.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      {result.status === 'failed' && (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      )}
                      {result.status === 'skipped' && (
                        <AlertTriangle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="font-medium text-white">
                        {result.table} - {result.record_id.substring(0, 8)}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400 text-xs space-y-1">
                    <div className="truncate">
                      <span className="text-gray-500">Old:</span> {result.old_url}
                    </div>
                    {result.new_url && (
                      <div className="truncate">
                        <span className="text-gray-500">New:</span> {result.new_url}
                      </div>
                    )}
                    {result.error && (
                      <div className="text-red-400">
                        <span className="text-gray-500">Error:</span> {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminImageMigrationPage;
