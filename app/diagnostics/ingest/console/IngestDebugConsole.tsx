'use client'
import { useState } from 'react'
import { 
  fetchSites, 
  parseFeeds, 
  filterAndNormalize, 
  simulateUpsert, 
  runNow, 
  validateLinks,
  parseXmlSnapshot,
  runSnapshotUpsert
} from './actions'

interface DebugConsoleProps {
  hasServiceRoleKey: boolean
  projectRef: string
  sites: string[]
  serverTime: string
  latestRun: any
}

interface FetchResult {
  url: string
  status: number
  contentType: string
  bytes: number
  elapsedMs: number
  success: boolean
}

interface ParseResult {
  itemCount: number
  samples: Array<{
    title: string
    link: string
    pubDate: string
  }>
  skipped: boolean
  skipReason?: string
}

interface FilterResult {
  kept: number
  invalidUrl: number
  parseError: number
  duplicateSourceId: number
  normalizedUrls: string[]
}

interface UpsertResult {
  wouldInsert: number
  wouldUpdate: number
  newCount: number
  updatedCount: number
  runId?: string
}

export default function IngestDebugConsole({ 
  hasServiceRoleKey, 
  projectRef, 
  sites, 
  serverTime,
  latestRun 
}: DebugConsoleProps) {
  const [configStep, setConfigStep] = useState(true)
  const [fetchStep, setFetchStep] = useState(false)
  const [parseStep, setParseStep] = useState(false)
  const [filterStep, setFilterStep] = useState(false)
  const [upsertStep, setUpsertStep] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  
  const [fetchResults, setFetchResults] = useState<FetchResult[]>([])
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [filterResult, setFilterResult] = useState<FilterResult | null>(null)
  const [upsertResult, setUpsertResult] = useState<UpsertResult | null>(null)
  
  // Snapshot functionality
  const [xmlContent, setXmlContent] = useState('')
  const [snapshotParseResult, setSnapshotParseResult] = useState<ParseResult | null>(null)
  const [snapshotFilterResult, setSnapshotFilterResult] = useState<FilterResult | null>(null)
  const [snapshotUpsertResult, setSnapshotUpsertResult] = useState<UpsertResult | null>(null)

  const runDebugPipeline = async () => {
    setIsRunning(true)
    
    try {
      // Step 1: Config (already shown)
      setConfigStep(true)
      
      // Step 2: Fetch test per site
      setFetchStep(true)
      const fetchResults = await fetchSites(sites)
      setFetchResults(fetchResults)
      
      // Step 3: Parse
      setParseStep(true)
      const parseResult = await parseFeeds(fetchResults)
      setParseResult(parseResult)
      
      // Step 4: Filter/normalize
      setFilterStep(true)
      const filterResult = await filterAndNormalize(parseResult, sites)
      setFilterResult(filterResult)
      
      // Step 5: Upsert simulation
      setUpsertStep(true)
      const upsertResult = await simulateUpsert(filterResult)
      setUpsertResult(upsertResult)
      
    } catch (error) {
      console.error('Debug pipeline error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleRunNow = async () => {
    setIsRunning(true)
    try {
      const result = await runNow()
      setUpsertResult(result)
    } catch (error) {
      console.error('Run Now error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleValidateLinks = async () => {
    if (!filterResult?.normalizedUrls) return
    
    setIsRunning(true)
    try {
      const result = await validateLinks(filterResult.normalizedUrls)
      // You could add state to display validation results
      console.log('Link validation result:', result)
    } catch (error) {
      console.error('Link validation error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleParseSnapshot = async () => {
    if (!xmlContent.trim()) return
    
    setIsRunning(true)
    try {
      const result = await parseXmlSnapshot(xmlContent, sites[0] || 'https://louisville.craigslist.org/search/gms?format=rss')
      setSnapshotParseResult(result)
      
      if (!result.skipped) {
        const filterResult = await filterAndNormalize(result, sites)
        setSnapshotFilterResult(filterResult)
      }
    } catch (error) {
      console.error('Snapshot parse error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSnapshotRunNow = async () => {
    if (!snapshotParseResult || snapshotParseResult.skipped) return
    
    setIsRunning(true)
    try {
      const result = await runSnapshotUpsert(snapshotParseResult, sites[0] || 'https://louisville.craigslist.org/search/gms?format=rss')
      setSnapshotUpsertResult(result)
    } catch (error) {
      console.error('Snapshot run error:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      setXmlContent(content)
      await handleParseSnapshot()
    }
    reader.readAsText(file)
  }

  const getStatusBadge = (success: boolean, status?: number) => {
    if (success) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Success</span>
    if (status === 0) return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">✗ Error</span>
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">⚠ {status}</span>
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Config Snapshot */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">1. Configuration Snapshot</h2>
          {configStep && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Ready</span>}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Service Role Key:</span>
            <span className={`ml-2 ${hasServiceRoleKey ? 'text-green-600' : 'text-red-600'}`}>
              {hasServiceRoleKey ? '✓ Available' : '✗ Missing'}
            </span>
          </div>
          <div>
            <span className="font-medium">Project Ref:</span>
            <span className="ml-2 font-mono text-gray-600">{projectRef}</span>
          </div>
          <div>
            <span className="font-medium">Sites Count:</span>
            <span className="ml-2 text-blue-600">{sites.length}</span>
          </div>
          <div>
            <span className="font-medium">Server Time:</span>
            <span className="ml-2 text-gray-600">{new Date(serverTime).toLocaleString()}</span>
          </div>
        </div>
        
        {sites.length > 0 && (
          <div className="mt-4">
            <span className="font-medium text-sm">Configured Sites:</span>
            <div className="mt-2 space-y-1">
              {sites.map((site, index) => {
                const url = new URL(site)
                return (
                  <div key={index} className="text-sm text-gray-600 font-mono">
                    {url.hostname}{url.pathname}
                    {url.search && <span className="text-gray-400">...</span>}
                  </div>
                )
              })}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              (fetch uses full URL incl. query)
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Fetch Test */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">2. Fetch Test per Site</h2>
          {fetchStep && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Complete</span>}
        </div>
        
        {fetchResults.length > 0 ? (
          <div className="space-y-3">
            {fetchResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm">{result.url.replace(/^https?:\/\//, '').slice(0, 30)}...</div>
                  {getStatusBadge(result.success, result.status)}
                </div>
                <div className="mt-2 grid grid-cols-4 gap-4 text-xs text-gray-600">
                  <div>Status: {result.status}</div>
                  <div>Type: {result.contentType.split(';')[0]}</div>
                  <div>Bytes: {result.bytes.toLocaleString()}</div>
                  <div>Time: {result.elapsedMs}ms</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <button
            onClick={runDebugPipeline}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Start Debug Pipeline'}
          </button>
        )}
      </div>

      {/* Step 3: Parse */}
      {parseStep && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">3. Parse RSS Items</h2>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Complete</span>
          </div>
          
          {parseResult && (
            <div className="space-y-4">
              {parseResult.skipped ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="text-sm text-yellow-800">
                    <strong>Parse skipped:</strong> {parseResult.skipReason}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-sm">
                    <span className="font-medium">Items Found:</span>
                    <span className="ml-2 text-blue-600">{parseResult.itemCount}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">Sample Items:</span>
                    <div className="mt-2 space-y-2">
                      {parseResult.samples.map((sample, index) => (
                        <div key={index} className="border-l-4 border-blue-200 pl-3 text-sm">
                          <div className="font-medium">{sample.title}</div>
                          <div className="text-gray-600 font-mono text-xs">{sample.link}</div>
                          <div className="text-gray-500 text-xs">{sample.pubDate ? new Date(sample.pubDate).toLocaleString() : 'No date'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Filter/Normalize */}
      {filterStep && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">4. Filter & Normalize URLs</h2>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Complete</span>
          </div>
          
          {filterResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{filterResult.kept}</div>
                  <div className="text-gray-600">Kept</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{filterResult.invalidUrl}</div>
                  <div className="text-gray-600">Invalid URL</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{filterResult.parseError}</div>
                  <div className="text-gray-600">Parse Error</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{filterResult.duplicateSourceId}</div>
                  <div className="text-gray-600">Duplicate</div>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-sm">Normalized URLs (first 5):</span>
                <div className="mt-2 space-y-1">
                  {filterResult.normalizedUrls.slice(0, 5).map((url, index) => (
                    <div key={index} className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded">
                      {url}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Upsert */}
      {upsertStep && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">5. Database Upsert</h2>
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">✓ Ready</span>
          </div>
          
          {upsertResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Would Insert:</span>
                  <span className="ml-2 text-green-600">{upsertResult.wouldInsert}</span>
                </div>
                <div>
                  <span className="font-medium">Would Update:</span>
                  <span className="ml-2 text-blue-600">{upsertResult.wouldUpdate}</span>
                </div>
                {upsertResult.newCount > 0 && (
                  <div>
                    <span className="font-medium">New Count:</span>
                    <span className="ml-2 text-green-600">{upsertResult.newCount}</span>
                  </div>
                )}
                {upsertResult.updatedCount > 0 && (
                  <div>
                    <span className="font-medium">Updated Count:</span>
                    <span className="ml-2 text-blue-600">{upsertResult.updatedCount}</span>
                  </div>
                )}
              </div>
              
              {upsertResult.runId && (
                <div className="text-sm">
                  <span className="font-medium">Run ID:</span>
                  <span className="ml-2 font-mono text-gray-600">{upsertResult.runId}</span>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleRunNow}
              disabled={isRunning}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Now (Real Upsert)'}
            </button>
          </div>
        </div>
      )}

      {/* Link Validator */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Link Validator</h2>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Optional</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Validate normalized URLs by checking their HTTP status codes.
        </p>
        
        <button
          onClick={handleValidateLinks}
          disabled={isRunning || !filterResult?.normalizedUrls?.length}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {isRunning ? 'Validating...' : 'Validate Links'}
        </button>
      </div>

      {/* Snapshot Ingestion */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Snapshot Ingestion</h2>
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Bypass Network</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Paste RSS XML or upload a file to bypass network fetch (useful when getting 403 errors).
        </p>
        
        <div className="space-y-4">
          {/* Paste XML */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste RSS XML
            </label>
            <textarea
              value={xmlContent}
              onChange={(e) => setXmlContent(e.target.value)}
              placeholder="Paste your RSS XML content here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleParseSnapshot}
              disabled={isRunning || !xmlContent.trim()}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? 'Parsing...' : 'Parse Snapshot'}
            </button>
          </div>
          
          {/* Upload File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload XML File
            </label>
            <input
              type="file"
              accept=".xml,.rss"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {/* Snapshot Parse Results */}
          {snapshotParseResult && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Snapshot Parse Results</h3>
              {snapshotParseResult.skipped ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="text-sm text-yellow-800">
                    <strong>Parse skipped:</strong> {snapshotParseResult.skipReason}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Items Found:</span>
                    <span className="ml-2 text-blue-600">{snapshotParseResult.itemCount}</span>
                  </div>
                  
                  {snapshotParseResult.samples.length > 0 && (
                    <div>
                      <span className="font-medium text-sm">Sample Items:</span>
                      <div className="mt-2 space-y-2">
                        {snapshotParseResult.samples.map((sample, index) => (
                          <div key={index} className="border-l-4 border-blue-200 pl-3 text-sm">
                            <div className="font-medium">{sample.title}</div>
                            <div className="text-gray-600 font-mono text-xs">{sample.link}</div>
                            <div className="text-gray-500 text-xs">{sample.pubDate ? new Date(sample.pubDate).toLocaleString() : 'No date'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {snapshotFilterResult && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm text-gray-900 mb-2">Filter Results</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>Kept: {snapshotFilterResult.kept}</div>
                        <div>Invalid URL: {snapshotFilterResult.invalidUrl}</div>
                        <div>Parse Error: {snapshotFilterResult.parseError}</div>
                        <div>Duplicate: {snapshotFilterResult.duplicateSourceId}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4">
                    <button
                      onClick={handleSnapshotRunNow}
                      disabled={isRunning || snapshotParseResult.skipped}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isRunning ? 'Running...' : 'Run Now (Real Upsert)'}
                    </button>
                  </div>
                  
                  {snapshotUpsertResult && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-sm text-green-800">
                        <strong>Upsert Complete:</strong> {snapshotUpsertResult.newCount} new, {snapshotUpsertResult.updatedCount} updated
                        {snapshotUpsertResult.runId && (
                          <div className="mt-1 text-xs">Run ID: {snapshotUpsertResult.runId}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
