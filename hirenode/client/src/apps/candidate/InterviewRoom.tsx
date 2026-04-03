import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { MicOff, Send } from 'lucide-react'

export default function InterviewRoom() {
  const { tenantSlug, token } = useParams()
  const navigate = useNavigate()
  
  const [status, setStatus] = useState<'initializing' | 'ai_speaking' | 'listening' | 'processing' | 'error' | 'completed'>('initializing')
  const [question, setQuestion] = useState('Setting up interview room...')
  const [questionNumber, setQuestionNumber] = useState(1)
  const [totalQuestions, setTotalQuestions] = useState(8)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const conversationHistoryRef = useRef<any[]>([])
  
  // Waveform visualization refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aiAnalyserRef = useRef<AnalyserNode | null>(null)
  const userAnalyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>(0)

  // Start interview on mount
  useEffect(() => {
    let mounted = true
    
    const initInterview = async () => {
      try {
        const res = await api.post('/interview/start', { token })
        if (!mounted) return
        
        setQuestion(res.data.question)
        setQuestionNumber(res.data.questionNumber)
        setTotalQuestions(res.data.totalQuestions || 8)
        
        conversationHistoryRef.current = [{
          role: 'ai',
          content: res.data.question,
          competencyAssessed: res.data.competencyAssessed
        }]
        
        // Play AI question (if TTS audio was returned, but in start it might just be text, let's assume candidate reads it or TTS was played)
        // For /start, we'll just go straight to listening
        setupRecording()
      } catch (err: any) {
        if (!mounted) return
        console.error(err)
        if (err.response?.status === 410) {
          navigate(`/${tenantSlug}/complete`)
        } else {
          setStatus('error')
        }
      }
    }
    
    initInterview()
    
    // Heartbeat loop
    const heartbeatInterval = setInterval(() => {
      api.post('/interview/heartbeat', { token }).catch(() => {})
    }, 60000)
    
    // Anti-cheating generic
    const onVisibilityChange = () => {
      if (document.hidden) {
        api.post('/interview/flag', { token, flagType: 'tab_switch' }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    
    return () => {
      mounted = false
      clearInterval(heartbeatInterval)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [token, tenantSlug, navigate])

  const setupRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      userAnalyserRef.current = analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        audioChunksRef.current = [] // reset
        
        await processAudio(audioBlob)
      }
      
      setStatus('listening')
      mediaRecorder.start(100) // Time slicing
      drawWaveform('user')
      
    } catch (err) {
      console.error('Failed to get mic access', err)
      setStatus('error')
    }
  }

  const handleDoneAnswering = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setStatus('processing')
      mediaRecorderRef.current.stop()
    }
  }

  const processAudio = async (blob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('token', token as string)
      formData.append('conversationHistory', JSON.stringify(conversationHistoryRef.current))
      formData.append('questionNumber', questionNumber.toString())
      
      const res = await api.post('/interview/process-audio', formData)
      
      if (res.data.interviewStatus === 'completed') {
        setStatus('completed')
        setTimeout(() => {
          navigate(`/${tenantSlug}/complete`)
        }, 2000)
        return
      }
      
      if (res.data.transcribedText) {
        conversationHistoryRef.current.push({
          role: 'candidate',
          content: res.data.transcribedText
        })
      }
      
      setQuestion(res.data.question)
      setQuestionNumber(res.data.questionNumber)
      
      conversationHistoryRef.current.push({
        role: 'ai',
        content: res.data.question,
        competencyAssessed: res.data.competencyAssessed
      })
      
      // Play AI Audio TTS
      if (res.data.audioBase64) {
        setStatus('ai_speaking')
        const arrayBuffer = Uint8Array.from(atob(res.data.audioBase64), c => c.charCodeAt(0)).buffer
        const audioCtx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioCtx
        
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        const source = audioCtx.createBufferSource()
        source.buffer = audioBuffer
        
        const analyser = audioCtx.createAnalyser()
        aiAnalyserRef.current = analyser
        source.connect(analyser)
        analyser.connect(audioCtx.destination)
        
        source.onended = () => {
          // AI done speaking, setup recording again
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
            setStatus('listening')
            mediaRecorderRef.current.start(100)
            drawWaveform('user')
          }
        }
        
        source.start(0)
        drawWaveform('ai')
      } else {
        // No audio returned, just move to listening state
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
          setStatus('listening')
          mediaRecorderRef.current.start(100)
          drawWaveform('user')
        }
      }
      
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  // Draw waveform logic
  const drawWaveform = (mode: 'user' | 'ai') => {
    const canvas = canvasRef.current
    if (!canvas) return
    const canvasCtx = canvas.getContext('2d')
    if (!canvasCtx) return
    
    const analyser = mode === 'ai' ? aiAnalyserRef.current : userAnalyserRef.current
    if (!analyser) return
    
    analyser.fftSize = 256
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    const draw = () => {
      if ((mode === 'ai' && status !== 'ai_speaking') || (mode === 'user' && status !== 'listening')) {
        return // stop animation
      }
      
      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)
      
      canvasCtx.fillStyle = 'rgba(15, 23, 42, 0.2)' // slate-900 bg
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)
      
      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2
        
        const color = mode === 'ai' ? `rgba(56, 189, 248, ${barHeight/150})` : `rgba(52, 211, 153, ${barHeight/150})`
        canvasCtx.fillStyle = color
        
        // draw from middle
        canvasCtx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight)
        x += barWidth + 1
      }
    }
    
    draw()
  }

  // Render varying UI states
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col p-4 sm:p-8">
      {/* Header */}
      <header className="flex justify-between items-center w-full max-w-4xl mx-auto mb-8">
        <div className="font-bold text-xl tracking-tight text-slate-100">HireNode</div>
        <div className="flex items-center space-x-2 bg-slate-800/50 rounded-full px-4 py-1.5 border border-slate-700">
          <span className="text-sm font-medium text-slate-300">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-primary" 
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full space-y-12">
        
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          {status === 'initializing' && <span className="flex h-3 w-3 rounded-full bg-slate-500 animate-pulse" />}
          {status === 'ai_speaking' && <span className="flex h-3 w-3 rounded-full bg-brand-primary animate-pulse" />}
          {status === 'listening' && <span className="flex h-3 w-3 rounded-full bg-brand-success animate-pulse" />}
          {status === 'processing' && <span className="flex h-3 w-3 rounded-full bg-brand-warning animate-pulse" />}
          {status === 'completed' && <span className="flex h-3 w-3 rounded-full bg-brand-success" />}
          
          <span className="text-sm font-medium tracking-wide uppercase text-slate-400">
            {status.replace('_', ' ')}
          </span>
        </div>

        {/* AI Persona & Message */}
        <Card className={`w-full glass-panel transition-all duration-500 border-2 ${
          status === 'ai_speaking' ? 'border-brand-primary/50 shadow-[0_0_30px_rgba(56,189,248,0.2)]' : 'border-slate-800/50'
        }`}>
          <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-white max-w-2xl leading-relaxed">
              "{question}"
            </h2>
            
            {/* Visualizer Canvas */}
            <div className="w-full h-32 flex items-center justify-center relative">
              <canvas 
                ref={canvasRef} 
                width={300} 
                height={100} 
                className="w-full max-w-md h-full absolute"
              />
              {status === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-brand-warning animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-warning animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-brand-warning animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-col items-center space-y-4">
          <Button 
            size="lg" 
            className={`rounded-full px-8 py-6 text-lg tracking-wide shadow-xl transition-all duration-300 ${
              status === 'listening' 
                ? 'bg-brand-success hover:bg-brand-success/90 hover:scale-105 shadow-[0_0_20px_rgba(52,211,153,0.3)] text-slate-900 border-2 border-transparent' 
                : 'bg-slate-800 text-slate-400 cursor-not-allowed border-2 border-slate-700'
            }`}
            disabled={status !== 'listening'}
            onClick={handleDoneAnswering}
          >
            {status === 'listening' ? (
              <>
                <Send className="mr-2 h-5 w-5" /> Done Answering
              </>
            ) : status === 'ai_speaking' ? (
              <>
                <MicOff className="mr-2 h-5 w-5" /> AI is Speaking
              </>
            ) : status === 'processing' ? (
              <>
                Analyzing...
              </>
            ) : (
              <>Please wait</>
            )}
          </Button>
          <p className="text-sm text-slate-500">
            {status === 'listening' ? "Take your time. Click when you're finished." : "Please do not close this tab."}
          </p>
        </div>

      </main>
    </div>
  )
}
