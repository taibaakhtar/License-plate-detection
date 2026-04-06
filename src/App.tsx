import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { 
  Activity, 
  Camera, 
  History, 
  Search, 
  Settings, 
  Shield, 
  Wifi, 
  AlertCircle,
  Maximize2,
  Download,
  Trash2,
  RefreshCcw,
  ChevronRight,
  Upload,
  FileVideo,
  FileImage,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Detection, StreamStatus } from './types';

type Mode = 'stream' | 'upload';

export default function App() {
  const [mode, setMode] = useState<Mode>('stream');
  const [streamUrl, setStreamUrl] = useState<string>('');
  const [apiUrl, setApiUrl] = useState<string>('https://trippingly-accusable-jaylene.ngrok-free.dev/detect/video');
  const [resolution, setResolution] = useState<string>('960');
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<StreamStatus>({ connected: false, fps: 0, latency: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  
  const videoRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDetections = detections.filter(d => 
    d.plate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConnect = (e: FormEvent) => {
    e.preventDefault();
    if (streamUrl) {
      setStatus({ connected: true, fps: 24, latency: 120 });
      setIsConfiguring(false);
      setMode('stream');
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileType(file.type.startsWith('video') ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    setIsConfiguring(false);
    setMode('upload');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('resolution', resolution);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Detection failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Assuming data is an array of detections or an object containing them
      // We'll adapt it to our Detection type
      const newDetections: Detection[] = (Array.isArray(data) ? data : data.detections || []).map((d: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        plate: d.plate || 'UNKNOWN',
        bbox: d.bbox || [0, 0, 0, 0],
        confidence: d.confidence || 0,
        timestamp: new Date().toISOString(),
        status: 'new'
      }));

      if (newDetections.length > 0) {
        setDetections(prev => [...newDetections, ...prev].slice(0, 100));
      } else {
        console.warn('No plates detected in the uploaded file.');
      }
      
      setStatus({ connected: true, fps: 0, latency: 0 });
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}. \n\nTip: Ensure your ngrok tunnel is active and CORS is enabled on the backend.`);
      setStatus({ connected: false, fps: 0, latency: 0 });
      setIsConfiguring(true); // Return to config on error
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col overflow-hidden">
      <div className="scanline" />
      
      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-black/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm">
            <Shield className="text-black w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold tracking-tighter text-xl uppercase leading-none">LPD.CORE</h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Security Monitoring System</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 font-mono text-[10px] tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${status.connected ? 'bg-white animate-pulse' : 'bg-zinc-800'}`} />
              <span className={status.connected ? 'text-white' : 'text-zinc-600'}>
                {status.connected ? 'System Online' : 'System Offline'}
              </span>
            </div>
            {status.connected && mode === 'stream' && (
              <>
                <div className="w-px h-3 bg-zinc-800" />
                <span className="text-zinc-400">{status.fps} FPS</span>
                <div className="w-px h-3 bg-zinc-800" />
                <span className="text-zinc-400">{status.latency}ms Latency</span>
              </>
            )}
            {mode === 'upload' && (
              <>
                <div className="w-px h-3 bg-zinc-800" />
                <span className="text-zinc-400">Analysis Mode</span>
              </>
            )}
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-zinc-900 rounded-sm transition-colors"
          >
            <Settings className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative bg-zinc-950">
          {/* Stream Container */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            {isConfiguring ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {/* Stream Option */}
                <div className="p-8 border border-zinc-800 bg-black">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">Live Stream</h2>
                    <p className="text-zinc-500 text-sm">Connect to a live MJPEG stream endpoint.</p>
                  </div>
                  <form onSubmit={handleConnect} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Stream URL</label>
                      <input 
                        type="url" 
                        placeholder="https://.../video"
                        className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                        value={streamUrl}
                        onChange={(e) => setStreamUrl(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!streamUrl}
                      className="w-full bg-white text-black font-bold py-3 uppercase tracking-tighter hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      Start Stream
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Upload Option */}
                <div className="p-8 border border-zinc-800 bg-black">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold tracking-tighter uppercase mb-2">File Analysis</h2>
                    <p className="text-zinc-500 text-sm">Upload an image or video for plate detection.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Resolution</label>
                      <input 
                        type="text" 
                        className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                      />
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border border-white text-white font-bold py-3 uppercase tracking-tighter hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Media
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="relative w-full h-full max-w-5xl aspect-video bg-black border border-zinc-800 overflow-hidden group">
                {isUploading && (
                  <div className="absolute inset-0 z-30 bg-black/60 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-white" />
                    <p className="text-xs font-mono uppercase tracking-widest">Processing Media...</p>
                  </div>
                )}

                {/* Media Display */}
                {mode === 'stream' ? (
                  <img 
                    ref={videoRef}
                    src={streamUrl || "https://picsum.photos/seed/traffic/1280/720"} 
                    alt="Live Stream"
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                    {fileType === 'video' ? (
                      <video 
                        src={previewUrl || ''} 
                        controls 
                        className="max-w-full max-h-full"
                      />
                    ) : (
                      <img 
                        src={previewUrl || ''} 
                        alt="Preview" 
                        className="max-w-full max-h-full object-contain"
                      />
                    )}
                  </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner Accents */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/40" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/40" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/40" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/40" />

                  {/* Detection Boxes */}
                  <AnimatePresence>
                    {detections.slice(0, 5).map((d) => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute border-2 border-white"
                        style={{
                          left: `${d.bbox[0]}px`,
                          top: `${d.bbox[1]}px`,
                          width: `${d.bbox[2] - d.bbox[0]}px`,
                          height: `${d.bbox[3] - d.bbox[1]}px`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 bg-white text-black text-[10px] font-bold px-1 py-0.5 whitespace-nowrap">
                          {d.plate} | {(d.confidence * 100).toFixed(1)}%
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Stream Controls Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 bg-black/80 border border-zinc-800 hover:bg-white hover:text-black transition-all">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsConfiguring(true)}
                    className="p-2 bg-black/80 border border-zinc-800 hover:bg-white hover:text-black transition-all"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Indicator */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${mode === 'stream' ? 'bg-red-600' : 'bg-blue-600'}`} />
                  <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                    {mode === 'stream' ? 'LIVE' : 'ANALYSIS'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Panel */}
          <div className="h-24 border-t border-zinc-800 bg-black p-4 flex items-center justify-between">
            <div className="flex gap-8">
              <div>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Total Detections</p>
                <p className="text-2xl font-bold tracking-tighter">{detections.length}</p>
              </div>
              <div className="w-px h-10 bg-zinc-800 self-center" />
              <div>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Mode</p>
                <p className="text-2xl font-bold tracking-tighter uppercase">{mode}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-4 py-2 border border-zinc-800 hover:bg-zinc-900 transition-colors text-xs uppercase font-bold tracking-tighter">
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button 
                onClick={() => setDetections([])}
                className="flex items-center gap-2 px-4 py-2 border border-zinc-800 hover:bg-zinc-900 transition-colors text-xs uppercase font-bold tracking-tighter text-zinc-500"
              >
                <Trash2 className="w-4 h-4" />
                Clear Logs
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Detection Logs */}
        <aside className="w-96 border-l border-zinc-800 flex flex-col bg-black z-10">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold tracking-tighter uppercase flex items-center gap-2">
                <History className="w-5 h-5" />
                Detection Logs
              </h2>
              <Activity className="w-4 h-4 text-zinc-600" />
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search Plate ID..."
                className="w-full bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-white transition-colors font-mono"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence initial={false}>
              {filteredDetections.length > 0 ? (
                filteredDetections.map((d) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 border-b border-zinc-900 hover:bg-zinc-950 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tighter font-mono group-hover:text-white transition-colors">
                          {d.plate}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                          {new Date(d.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${
                        d.status === 'new' ? 'border-white bg-white text-black' : 'border-zinc-800 text-zinc-600'
                      }`}>
                        {d.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1">
                        CONF: {(d.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="flex items-center gap-1">
                        ID: {d.id.slice(0, 4)}
                      </span>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <AlertCircle className="w-8 h-8 text-zinc-800 mb-4" />
                  <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">No Detections Found</p>
                  <p className="text-zinc-700 text-xs mt-2">Adjust filters or check stream status</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </aside>
      </main>

      {/* Settings Modal (Overlay) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="max-w-2xl w-full bg-black border border-zinc-800 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold tracking-tighter uppercase">System Configuration</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-zinc-900 rounded-sm"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">API Endpoint</label>
                    <input 
                      type="text" 
                      className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm focus:outline-none font-mono"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Detection Threshold</label>
                    <input type="range" className="w-full accent-white" />
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                      <span>0.1</span>
                      <span>0.85 (Current)</span>
                      <span>1.0</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-tighter">Auto-Save Logs</span>
                    <div className="w-10 h-5 bg-white rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-tighter">Audio Alerts</span>
                    <div className="w-10 h-5 bg-zinc-800 rounded-full relative">
                      <div className="absolute left-1 top-1 w-3 h-3 bg-zinc-600 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-white text-black font-bold py-4 mt-12 uppercase tracking-tighter hover:bg-zinc-200 transition-colors"
              >
                Apply Changes
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-zinc-800 bg-black flex items-center justify-between px-6 text-[9px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3" />
            {status.connected ? 'LINK_ESTABLISHED' : 'LINK_DISCONNECTED'}
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3 h-3" />
            ENCRYPTED_SESSION
          </span>
        </div>
        <div>
          © 2026 CORE_SYSTEMS_INTL // v2.4.0-STABLE
        </div>
      </footer>
    </div>
  );
}
