import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import promptGuide from './PromptFORGPT';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function App() {
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [vertical, setVertical] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [angle, setAngle] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [copiedPrompts, setCopiedPrompts] = useState({});
  const fileInputRef = useRef(null);
  
  const sentimentOptions = [
    'Professional',
    'Salesy',
    'Funny',
    'Occasional',
    'Casual',
    'Formal',
    'Emotional',
    'Inspirational',
    'Educational',
    'Conversational',
    'Authoritative',
    'Friendly',
    'Humorous',
    'Serious',
    'Playful',
    'Mixed',
  ];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // Progress bar states
  const [showProgress, setShowProgress] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  const progressSteps = [
    'Uploading Images',
    'Analyzing Content',
    'Generating Prompts',
    'Creating Images',
    'Finalizing Results'
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!loading) {
          document.querySelector('.generate-button')?.click();
        }
      }
      if (e.key === 'Escape') {
        if (selectedImage) {
          setSelectedImage(null);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, selectedImage]);

  // Drag and drop functionality
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  // Create image previews
  const createImagePreviews = (files) => {
    const previews = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9)
    }));
    setImagePreviews(previews);
  };

  // Handle file selection
  const handleFiles = (files) => {
    setImages(files);
    createImagePreviews(files);
    setError('');
    setFieldErrors(prev => ({ ...prev, images: false }));
  };

  const handleImageChange = event => {
    const files = Array.from(event.target.files);
    handleFiles(files);
  };

  const removeImage = (id) => {
    const updatedPreviews = imagePreviews.filter(preview => preview.id !== id);
    setImagePreviews(updatedPreviews);
    const updatedFiles = updatedPreviews.map(preview => preview.file);
    setImages(updatedFiles);
  };

  // Field validation
  const validateField = (name, value) => {
    let isValid = true;
    switch (name) {
      case 'vertical':
        isValid = value.trim().length >= 2;
        break;
      case 'ageGroup':
        isValid = value.trim().length >= 2;
        break;
      case 'angle':
        isValid = value.trim().length >= 5;
        break;
      case 'sentiment':
        isValid = value.trim().length > 0;
        break;
      default:
        break;
    }
    setFieldErrors(prev => ({ ...prev, [name]: !isValid }));
    return isValid;
  };

  const handleVerticalChange = e => {
    const value = e.target.value;
    setVertical(value);
    validateField('vertical', value);
    setError('');
  };

  const handleAgeGroupChange = e => {
    const value = e.target.value;
    setAgeGroup(value);
    validateField('ageGroup', value);
    setError('');
  };

  const handleAngleChange = e => {
    const value = e.target.value;
    setAngle(value);
    validateField('angle', value);
    setError('');
  };

  const handleSentimentChange = e => {
    const value = e.target.value;
    setSentiment(value);
    validateField('sentiment', value);
    setError('');
  };

  // Copy to clipboard functionality
  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompts(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedPrompts(prev => ({ ...prev, [index]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Enhanced copy function for prompts with visual feedback
  const copyPromptToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrompts(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiedPrompts(prev => ({ ...prev, [index]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedPrompts(prev => ({ ...prev, [index]: true }));
        setTimeout(() => {
          setCopiedPrompts(prev => ({ ...prev, [index]: false }));
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  // Lazy image loading component
  const LazyImage = ({ src, alt, className, onClick }) => {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => setLoaded(true);
            img.onerror = () => setError(true);
            img.src = src;
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }, [src]);

    return (
      <div 
        ref={imgRef} 
        className={`lazy-image ${loaded ? 'loaded' : ''} ${error ? 'error' : ''} ${className}`}
        onClick={onClick}
        style={{ width: '100%', height: '100%', minHeight: '200px' }}
      >
        {loaded && !error && (
          <img 
            src={src} 
            alt={alt} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: 'var(--error-color)',
            fontSize: 'var(--font-sm)'
          }}>
            ❌ Failed to load
          </div>
        )}
      </div>
    );
  };

  // Tooltip component
  const Tooltip = ({ children, text }) => (
    <div className="tooltip-container">
      <div className="tooltip-trigger">
        {children}
        <span className="tooltip-icon">?</span>
      </div>
      <div className="tooltip">{text}</div>
    </div>
  );

  // Simulate progress during generation
  const simulateProgress = () => {
    setShowProgress(true);
    setProgressPercent(0);
    setCurrentStep(0);
    
    const steps = [
      { step: 0, percent: 15, message: 'Uploading and processing images...', delay: 500 },
      { step: 1, percent: 35, message: 'Analyzing image content with AI...', delay: 1000 },
      { step: 2, percent: 60, message: 'Generating marketing prompts...', delay: 1500 },
      { step: 3, percent: 85, message: 'Creating new images with AI...', delay: 2000 },
      { step: 4, percent: 100, message: 'Finalizing and optimizing results...', delay: 500 }
    ];
    
    steps.forEach(({ step, percent, message, delay }, index) => {
      setTimeout(() => {
        setCurrentStep(step);
        setProgressPercent(percent);
        setProgressMessage(message);
      }, delay * (index + 1));
    });
  };

  const resetProgress = () => {
    setShowProgress(false);
    setProgressPercent(0);
    setCurrentStep(0);
    setProgressMessage('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!images.length) {
      setError('Please upload at least one image.');
      return;
    }
    if (!vertical.trim() || !ageGroup.trim() || !sentiment.trim() || !angle.trim()) {
      setError('Please enter vertical, age group, sentiment, and angle.');
      return;
    }
    
    setLoading(true);
    simulateProgress();
    
    const formData = new FormData();
    let promptString = `Vertical: ${vertical} | Age Group: ${ageGroup} | Sentiment: ${sentiment} | Angle: ${angle}`;
    // promptString += ` | ${promptGuide}`; // Commented out due to character limit

    // Add images to formData
    images.forEach(image => {
      formData.append('image', image);
    });

    formData.append('prompt', promptString);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate images');
      }

      const data = await response.json();
      if (data.results && Array.isArray(data.results)) {
        setResults(data.results);
        setPrompts(data.prompts || []);
        
        // Complete progress
        setTimeout(() => {
          setProgressPercent(100);
          setCurrentStep(4);
          setProgressMessage('Generation complete!');
          setTimeout(() => {
            resetProgress();
          }, 1000);
        }, 100);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while processing the images.');
      resetProgress();
    } finally {
      setLoading(false);
    }
  };

  // Export all images as zip (using backend)
  const handleExportAll = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/export-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: results }),
      });

      if (!response.ok) {
        throw new Error('Failed to export images');
      }

      const blob = await response.blob();
      saveAs(blob, 'ADGenerator2.0-images.zip');
    } catch (err) {
      setError('Failed to export images as zip.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (url, prompt) => {
    setSelectedImage({ url, prompt });
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className='container'>
      <h1>ADGenerator2.0 Internal Image Generator</h1>
      <form onSubmit={handleSubmit} className='form'>
        <div className='upload-section'>
          <div 
            className={`upload-box ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <h3>Upload Images</h3>
            <div className="upload-instructions">
              <strong>Choose files</strong> or <strong>drag and drop</strong>
              <br />
              Supports: JPG, PNG, GIF, WebP
            </div>
            <div className="drag-indicator">Drop images here</div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              onChange={handleImageChange}
              className='file-input'
            />
            {imagePreviews.length > 0 && (
              <div className="image-preview-container">
                {imagePreviews.map(preview => (
                  <div key={preview.id} className="image-preview">
                    <img src={preview.url} alt="Preview" />
                    <button 
                      type="button"
                      className="image-preview-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(preview.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length > 0 && <p className='file-info'>{images.length} image(s) selected</p>}
          </div>
        </div>

        <div className={`form-group ${fieldErrors.vertical ? 'has-error' : vertical ? 'has-success' : ''}`}>
          <Tooltip 
            text="Specify the business vertical or industry (e.g., 'Health & Wellness', 'Technology', 'Fashion')"
          >
            <label htmlFor='vertical'>Vertical:</label>
          </Tooltip>
          <input
            type='text'
            id='vertical'
            value={vertical}
            onChange={handleVerticalChange}
            placeholder='Enter vertical (e.g., Health & Wellness)'
            required
          />
          {fieldErrors.vertical && (
            <div className="field-hint error">Please enter at least 2 characters</div>
          )}
          {vertical && !fieldErrors.vertical && (
            <div className="field-hint success">✓ Valid vertical specified</div>
          )}
        </div>

        <div className={`form-group ${fieldErrors.angle ? 'has-error' : angle ? 'has-success' : ''}`}>
          <Tooltip 
            text="Describe the unique angle or perspective for the ad (e.g., 'Before/After transformation', 'Problem-solution approach')"
          >
            <label htmlFor='angle'>Angle:</label>
          </Tooltip>
          <input
            type='text'
            id='angle'
            value={angle}
            onChange={handleAngleChange}
            placeholder='Enter creative angle (e.g., Problem-solution approach)'
            required
          />
          {fieldErrors.angle && (
            <div className="field-hint error">Please enter at least 5 characters</div>
          )}
          {angle && !fieldErrors.angle && (
            <div className="field-hint success">✓ Good angle description</div>
          )}
        </div>

        <div className={`form-group ${fieldErrors.sentiment ? 'has-error' : sentiment ? 'has-success' : ''}`}>
          <Tooltip 
            text="Choose the emotional tone and style for your ad copy and imagery"
          >
            <label htmlFor='sentiment'>Sentiment:</label>
          </Tooltip>
          <select
            id='sentiment'
            value={sentiment}
            onChange={handleSentimentChange}
            className='sentiment-select'
            required
          >
            <option value=''>Select a sentiment...</option>
            {sentimentOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {sentiment && (
            <div className="field-hint success">✓ Sentiment selected</div>
          )}
        </div>

        <div className={`form-group ${fieldErrors.ageGroup ? 'has-error' : ageGroup ? 'has-success' : ''}`}>
          <Tooltip 
            text="Target age demographic for the ad (e.g., '25-35', '18-24', '35-50')"
          >
            <label htmlFor='ageGroup'>Age Group:</label>
          </Tooltip>
          <input
            type='text'
            id='ageGroup'
            value={ageGroup}
            onChange={handleAgeGroupChange}
            placeholder='Enter age group (e.g., 25-35)'
            required
          />
          {fieldErrors.ageGroup && (
            <div className="field-hint error">Please enter at least 2 characters</div>
          )}
          {ageGroup && !fieldErrors.ageGroup && (
            <div className="field-hint success">✓ Target age group specified</div>
          )}
        </div>

        {error && <div className='error'>{error}</div>}

        <button type='submit' disabled={loading} className={`generate-button ${loading ? 'loading' : ''}`}>
          {loading ? (
            <span className="loading-dots">Generating</span>
          ) : (
            'Generate Images'
          )}
        </button>
      </form>

      {/* Progress Bar */}
      <div className={`progress-container ${showProgress ? 'visible' : ''}`}>
        <div className='progress-wrapper'>
          <div className='progress-status'>
            <div className='progress-spinner'></div>
            <div className='progress-text'>{progressMessage}</div>
          </div>
          
          <div className='progress-bar-container'>
            <div className='progress-bar' style={{ width: `${progressPercent}%` }}></div>
          </div>
          
          <div className='progress-percentage'>{progressPercent}%</div>
          
          <div className='progress-steps'>
            {progressSteps.map((step, index) => (
              <div 
                key={index} 
                className={`progress-step ${
                  index < currentStep ? 'completed' : 
                  index === currentStep ? 'active' : ''
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && !results.length && (
        <div className='results'>
          <h2>
            <span className="typing-indicator">Generating Images</span>
          </h2>
          <div className='images'>
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className='loading-skeleton'>
                <div className='skeleton-image'></div>
                <div className='skeleton-text'></div>
                <div className='skeleton-text short'></div>
                <div className='skeleton-text medium'></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && images.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <h3 className="empty-state-title">Ready to Create Amazing Ads?</h3>
          <p className="empty-state-description">
            Upload your images and fill out the form above to generate professional marketing content with AI.
          </p>
          <button 
            className="empty-state-action"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Your First Image
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !loading && (
        <div className='results'>
          <h2>Generated Images</h2>
          <button
            className='export-all-btn'
            onClick={handleExportAll}
            disabled={loading}
          >
            📦 Export All as ZIP
          </button>
          <div className='images'>
            {results.map((url, idx) => (
              <div key={url} className='image-block'>
                <div className="image-container">
                  <LazyImage
                    src={url}
                    alt={`Generated ${idx + 1}`}
                    className="clickable-image"
                    onClick={() => handleImageClick(url, prompts[idx])}
                  />
                </div>
                <a
                  href={url}
                  download={`generated-image-${idx + 1}.jpg`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='download-btn'
                >
                  ⬇️ Download Image
                </a>
                {prompts[idx] && (
                  <div 
                    className='prompt-caption'
                    onClick={() => copyPromptToClipboard(prompts[idx], idx)}
                    title="Click to copy prompt"
                  >
                    {prompts[idx]}
                    <div className={`copy-feedback ${copiedPrompts[idx] ? 'show' : ''}`}>
                      Copied!
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className='modal-overlay' onClick={handleCloseModal}>
          <div className='modal-content' onClick={e => e.stopPropagation()}>
            <button className='modal-close' onClick={handleCloseModal}>
              ×
            </button>
            <div className="progressive-image">
              <div className="progressive-image-placeholder"></div>
              <img 
                src={selectedImage.url} 
                alt='Enlarged view' 
                className='modal-image loaded'
                onLoad={(e) => e.target.parentElement.classList.add('loaded')}
              />
            </div>
            {selectedImage.prompt && (
              <div className='modal-prompt'>
                {selectedImage.prompt}
                <button
                  className={`copy-button ${copiedPrompts['modal'] ? 'copied' : ''}`}
                  onClick={() => copyPromptToClipboard(selectedImage.prompt, 'modal')}
                >
                  {copiedPrompts['modal'] ? '✓ Copied!' : 'Copy Prompt'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts */}
      <div className="keyboard-shortcuts">
        <div className="keyboard-shortcut">
          <span className="key">Ctrl</span>
          <span>+</span>
          <span className="key">Enter</span>
          <span>Generate</span>
        </div>
        <div className="keyboard-shortcut">
          <span className="key">Esc</span>
          <span>Close Modal</span>
        </div>
      </div>
    </div>
  );
}

export default App;
