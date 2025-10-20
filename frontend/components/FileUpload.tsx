'use client'

import { useState } from 'react'
import { Upload, File, X, Loader2 } from 'lucide-react'
import { uploadApi, ApiError, parseApiError } from '../lib/api'
import { ErrorMessage, SuccessMessage, InlineError } from './ErrorMessage'

interface CourseModule {
  id: string
  index: number
  title: string
  start_date?: string
  end_date?: string
  objectives: string[]
  summary_notes: string[]
  pitfalls?: string[]
  resources: Record<string, any>
  daily_plan: Record<string, any>
  quiz: Record<string, any>
  assignment?: Record<string, any>
}

interface ParsedCourse {
  course_id: string
  title: string
  level?: string
  duration: string
  milestones?: string[]
  final_competency?: string
  source_filename: string
  structured: boolean
  timeline?: Record<string, any>
  library?: Record<string, any>
  modules: CourseModule[]
}

interface UploadResponse {
  message: string
  filename: string
  file_size: number
  content_type: string
  parsing_stats: {
    text_length: number
    modules_created: number
    structured_content: boolean
  }
  course: ParsedCourse
  status: string
}

export default function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<ApiError | string | null>(null)
  const [success, setSuccess] = useState<string>('')
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'text/plain']
  const ALLOWED_EXTENSIONS = ['.pdf', '.txt']

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PDF and plain text files are allowed.'
    }

    // Check file extension
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return 'File must have a .pdf or .txt extension.'
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${Math.round(MAX_FILE_SIZE / (1024 * 1024))} MB. Current size: ${Math.round(file.size / (1024 * 1024))} MB.`
    }

    // Check if file is empty
    if (file.size === 0) {
      return 'File cannot be empty.'
    }

    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      setSuccess('')
      setUploadResult(null)
      return
    }

    setSelectedFile(file)
    setError('')
    setSuccess('')
    setUploadResult(null)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (!file) return

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setSelectedFile(null)
      setSuccess('')
      setUploadResult(null)
      return
    }

    setSelectedFile(file)
    setError('')
    setSuccess('')
    setUploadResult(null)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const removeFile = () => {
    setSelectedFile(null)
    setError('')
    setSuccess('')
    setUploadResult(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)
    setSuccess('')

    try {
      const result = await uploadApi.uploadRoadmap(selectedFile)
      setSuccess(`File uploaded successfully! Created ${result.parsing_stats.modules_created} modules.`)
      setUploadResult(result)
    } catch (err: any) {
      // Enhanced error handling with backend error parsing
      const apiError = err.apiError || parseApiError(err)
      setError(apiError)
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Learning Roadmap</h2>
        
        {/* File Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            selectedFile 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        >
          {selectedFile ? (
            <div className="flex items-center justify-between bg-white rounded-lg p-4 border">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="text-gray-400 hover:text-red-500 transition-colors"
                disabled={isUploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your file here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt"
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports PDF and plain text files up to 10MB
              </p>
              <div className="flex justify-center space-x-4 text-xs text-gray-400">
                <span>📄 PDF</span>
                <span>📝 TXT</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4">
            <ErrorMessage 
              error={error} 
              variant="error"
              showRequestId={true}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4">
            <SuccessMessage 
              message={success}
              onDismiss={() => setSuccess('')}
            />
          </div>
        )}

        {/* Upload Button */}
        {selectedFile && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                'Upload and Parse'
              )}
            </button>
          </div>
        )}

        {/* Course Preview */}
        {uploadResult && (
          <div className="mt-8 border-t pt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Course Preview</h3>
            
            {/* Course Info */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                {uploadResult.course.title}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Duration:</span>
                  <p className="text-blue-800">{uploadResult.course.duration}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Level:</span>
                  <p className="text-blue-800">{uploadResult.course.level || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Modules:</span>
                  <p className="text-blue-800">{uploadResult.course.modules.length}</p>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Structured:</span>
                  <p className="text-blue-800">
                    {uploadResult.course.structured ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
              {uploadResult.course.final_competency && (
                <div className="mt-3">
                  <span className="text-blue-600 font-medium">Goal:</span>
                  <p className="text-blue-800">{uploadResult.course.final_competency}</p>
                </div>
              )}
            </div>

            {/* Modules List */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900">Modules ({uploadResult.course.modules.length})</h5>
              {uploadResult.course.modules.map((module, index) => (
                <div key={module.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h6 className="font-medium text-gray-900">
                      Module {module.index}: {module.title}
                    </h6>
                    {module.start_date && module.end_date && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {module.start_date} - {module.end_date}
                      </span>
                    )}
                  </div>
                  
                  {module.objectives.length > 0 && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-600">Objectives:</span>
                      <ul className="text-sm text-gray-700 ml-4 list-disc">
                        {module.objectives.slice(0, 3).map((objective, idx) => (
                          <li key={idx}>{objective}</li>
                        ))}
                        {module.objectives.length > 3 && (
                          <li className="text-gray-500">
                            +{module.objectives.length - 3} more objectives
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  
                  {module.summary_notes.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Summary:</span>
                      <p className="text-sm text-gray-700">
                        {module.summary_notes[0]}
                        {module.summary_notes.length > 1 && (
                          <span className="text-gray-500"> +{module.summary_notes.length - 1} more notes</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Parsing Stats */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-2">Parsing Statistics</h5>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Text Length:</span>
                  <p className="font-medium">{uploadResult.parsing_stats.text_length.toLocaleString()} chars</p>
                </div>
                <div>
                  <span className="text-gray-600">Modules Created:</span>
                  <p className="font-medium">{uploadResult.parsing_stats.modules_created}</p>
                </div>
                <div>
                  <span className="text-gray-600">Structured Content:</span>
                  <p className="font-medium">
                    {uploadResult.parsing_stats.structured_content ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}