import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { AlertCircle, RefreshCw, X } from 'lucide-react'

function ReloadPrompt() {
    const sw = useRegisterSW();

    // Jika SW tidak aktif atau tidak memberikan data array yang diharapkan, jangan tampilkan apa-apa
    if (!sw || !Array.isArray(sw.offlineReady) || !Array.isArray(sw.needUpdate)) {
        return null;
    }

    const [offlineReady, setOfflineReady] = sw.offlineReady;
    const [needUpdate, setNeedUpdate] = sw.needUpdate;
    const updateServiceWorker = sw.updateServiceWorker;

    const close = () => {
        setOfflineReady(false)
        setNeedUpdate(false)
    }

    if (!offlineReady && !needUpdate) return null

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl p-4 max-w-sm flex items-start gap-4">
                <div className={`p-2 rounded-full ${needUpdate ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {needUpdate ? <RefreshCw className="w-5 h-5 animate-spin-slow" /> : <AlertCircle className="w-5 h-5" />}
                </div>

                <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {needUpdate ? 'Update Tersedia!' : 'Aplikasi Siap Offline'}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {needUpdate
                            ? 'Versi baru tersedia. Refresh sekarang untuk memperbarui.'
                            : 'Aplikasi sekarang dapat diakses tanpa koneksi internet.'}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        {needUpdate && (
                            <button
                                onClick={() => updateServiceWorker?.(true)}
                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                            >
                                Refresh Sekarang
                            </button>
                        )}
                        <button
                            onClick={close}
                            className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>

                <button onClick={close} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

export default ReloadPrompt
