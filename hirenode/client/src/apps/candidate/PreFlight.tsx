import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Mic, CheckCircle, AlertCircle, Headphones } from 'lucide-react'

export default function PreFlight() {
  const { tenantSlug, token } = useParams()
  const navigate = useNavigate()
  
  const [isValidating, setIsValidating] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [jobDetails, setJobDetails] = useState<any>(null)
  
  const [micPermission, setMicPermission] = useState<boolean | null>(null)
  const [micLevel, setMicLevel] = useState(0)
  const [isTestingAudio, setIsTestingAudio] = useState(false)
  
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await api.get(`/interview/validate-token/${token}`)
        if (res.data.valid) {
          setJobDetails(res.data.candidate)
        }
      } catch (err: any) {
        setValidationError(err.response?.data?.error || 'Invalid or expired interview link')
      } finally {
        setIsValidating(false)
      }
    }
    
    validateToken()
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [token])

  const testMicrophone = async () => {
    setIsTestingAudio(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      setMicPermission(true)
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyserRef.current = analyser
      
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      const checkVolume = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength
        setMicLevel(average)
        requestAnimationFrame(checkVolume)
      }
      
      checkVolume()
      
    } catch (err) {
      setMicPermission(false)
      console.error(err)
    } finally {
      setIsTestingAudio(false)
    }
  }

  if (isValidating) {
    return <div className="flex h-screen items-center justify-center bg-brand-bg text-slate-400">Validating interview link...</div>
  }

  if (validationError) {
    return (
      <div className="flex h-screen items-center justify-center bg-brand-bg text-center p-4">
        <Card className="max-w-md w-full glass-panel">
          <CardContent className="pt-6 flex flex-col items-center">
            <AlertCircle className="h-16 w-16 text-brand-danger mb-4" />
            <h2 className="text-xl font-bold text-slate-100 mb-2">Link Expired or Invalid</h2>
            <p className="text-slate-400 mb-6">{validationError}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg p-4 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-primary sm:text-4xl">
            Welcome, {jobDetails?.name}
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            You're about to begin the AI interview for <strong className="text-slate-100">{jobDetails?.jobTitle}</strong>.
          </p>
        </div>

        <Card className="glass-panel mt-8">
          <CardHeader>
            <CardTitle>System Check</CardTitle>
            <CardDescription>Let's make sure your audio is working before we begin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Mic Check */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${micPermission ? 'bg-brand-success/20 text-brand-success' : 'bg-slate-700 text-slate-400'}`}>
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-200">Microphone</h3>
                  <p className="text-sm text-slate-400">
                    {micPermission === null ? 'Ready to test' : (micPermission ? 'Working properly' : 'Permission denied')}
                  </p>
                </div>
              </div>
              
              {!micPermission ? (
                <Button variant="outline" onClick={testMicrophone} isLoading={isTestingAudio}>
                  Test Mic
                </Button>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="text-brand-success text-sm font-medium mr-4 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" /> Checked
                  </div>
                  {/* Volume meter */}
                  <div className="flex space-x-1 h-6 w-24 items-end">
                    {[1, 2, 3, 4, 5].map((bar) => {
                      const isActive = micLevel > bar * 15
                      return (
                        <div 
                          key={bar} 
                          className={`w-4 rounded-sm transition-all duration-100 ${isActive ? 'bg-brand-success' : 'bg-slate-700'}`}
                          style={{ height: isActive ? `${Math.max(20, (micLevel / 100) * 100)}%` : '20%' }}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-start space-x-4">
              <Headphones className="h-6 w-6 text-brand-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-slate-200">Interview Instructions</h3>
                <ul className="mt-2 text-sm text-slate-400 list-disc pl-5 space-y-1">
                  <li>Find a quiet place with a stable internet connection.</li>
                  <li>Speak clearly and naturally.</li>
                  <li>You will be speaking with an AI agent.</li>
                  <li>There is no time limit. Press the "Done Answering" button when finished speaking.</li>
                  <li>Avoid switching tabs, as this will be flagged to HR.</li>
                </ul>
              </div>
            </div>
            
          </CardContent>
          <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center rounded-b-lg">
            <span className="text-sm text-brand-warning">
              {!micPermission && "Please test your microphone to proceed."}
            </span>
            <Button 
              disabled={!micPermission}
              onClick={() => navigate(`/${tenantSlug}/interview/${token}`)}
            >
              Enter Interview Room
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
