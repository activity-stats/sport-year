import { useState } from 'react';
import { useStravaConfigStore } from '../../stores/stravaConfigStore';

export function SetupWizard() {
  const { setConfig } = useStravaConfigStore();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [step, setStep] = useState<'instructions' | 'credentials'>('instructions');

  // Extract domain without port for Strava callback
  const hostname = window.location.hostname; // e.g., "localhost" or "example.com"
  const callbackDomain = hostname === 'localhost' ? 'localhost' : hostname;

  const handleSave = () => {
    if (clientId.trim() && clientSecret.trim()) {
      setConfig({ clientId: clientId.trim(), clientSecret: clientSecret.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">🏃</div>
            <div>
              <h1 className="text-4xl font-black">Welcome to Sport Year!</h1>
              <p className="text-orange-100 text-lg mt-1">Let's get you set up</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'instructions' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Step 1: Create a Strava App</h2>

              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>Why do I need this?</strong> Sport Year needs permission to access your
                    Strava data. You'll create your own Strava app to keep your credentials secure.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-semibold mb-2">
                        Go to Strava's API settings
                      </p>
                      <p className="text-gray-600 text-sm mb-3">
                        Click the link below. It will open in a new tab so you can easily switch
                        back here.
                      </p>
                      <a
                        href="https://www.strava.com/settings/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm"
                      >
                        <span>Open Strava API Settings</span>
                        <span className="text-lg">→</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-semibold mb-2">Create a new app</p>
                      <p className="text-gray-600 text-sm">
                        Click "Create New App" and fill in the form:
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <div>
                            <strong>Application Name:</strong> Sport Year (or any name you like)
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <div>
                            <strong>Category:</strong> Choose "Data Importer" or "Visualizer"
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <div>
                            <strong>Website:</strong> {window.location.origin}
                          </div>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <div>
                            <strong className="text-red-600">Authorization Callback Domain:</strong>
                            <div className="mt-1 bg-gray-900 text-white px-3 py-2 rounded font-mono text-xs break-all">
                              {callbackDomain}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              ⚠️ Enter only the domain (not the full URL with /callback or port
                              number)
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 font-semibold mb-2">Get your credentials</p>
                      <p className="text-gray-600 text-sm">
                        After creating the app, you'll see your <strong>Client ID</strong> and{' '}
                        <strong>Client Secret</strong>. Keep these safe - you'll need them in the
                        next step.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep('credentials')}
                  className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-orange-600 transition-colors shadow-lg"
                >
                  Next: Enter Credentials →
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Step 2: Enter Your Credentials
              </h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="clientId" className="block text-sm font-bold text-gray-700 mb-2">
                    Client ID
                  </label>
                  <input
                    id="clientId"
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="e.g., 123456"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">Found on your Strava app page</p>
                </div>

                <div>
                  <label
                    htmlFor="clientSecret"
                    className="block text-sm font-bold text-gray-700 mb-2"
                  >
                    Client Secret
                  </label>
                  <input
                    id="clientSecret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Enter your client secret"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Keep this secret! It's shown only once on Strava.
                  </p>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div className="text-sm text-yellow-900">
                      <strong>Security Note:</strong> Your credentials are stored locally in your
                      browser only. They never leave your device.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep('instructions')}
                  className="text-gray-600 hover:text-gray-900 font-semibold py-3 px-6"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={!clientId.trim() || !clientSecret.trim()}
                  className="bg-orange-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-orange-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save & Continue
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
