import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import promptGuide from './PromptFORGPT';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function App() {
  const [images, setImages] = useState([]);
  const [vertical, setVertical] = useState('');
  const [angle, setAngle] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [numImages, setNumImages] = useState(4);
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

  const [ageFrom, setAgeFrom] = useState(18);
  const [ageTo, setAgeTo] = useState(65);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedForRegen, setSelectedForRegen] = useState([]);

  // Add state for regenerating images
  const [regenerating, setRegenerating] = useState([]);

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

  const handleDragEnter = useCallback((e) => {
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

  // Handle file selection
  const handleFiles = (files) => {
    setImages(files);
    setError('');
    setFieldErrors(prev => ({ ...prev, images: false }));
  };

  const handleImageChange = event => {
    const files = Array.from(event.target.files);
    handleFiles(files);
  };

  const removeImage = (index) => {
    const updatedFiles = images.filter((_, i) => i !== index);
    setImages(updatedFiles);
  };

  // Field validation
  const validateField = (name, value) => {
    let isValid = true;
    switch (name) {
      case 'vertical':
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

  // Handle number of images change
  const handleNumImagesChange = e => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 20) {
      setNumImages(value);
    }
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
    if (!vertical.trim() || !sentiment.trim() || !angle.trim()) {
      setError('Please enter vertical, sentiment, and angle.');
      return;
    }
    
    setLoading(true);
    simulateProgress();
    
    const formData = new FormData();
    let promptString = `Vertical: ${vertical} | Sentiment: ${sentiment} | Angle: ${angle}`;
    // promptString += ` | ${promptGuide}`; // Commented out due to character limit

    // Add images to formData
    images.forEach(image => {
      formData.append('image', image);
    });

    formData.append('prompt', promptString);
    formData.append('numImages', numImages);

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
        setResults(data.results.slice(0, numImages));
        setPrompts((data.prompts || []).slice(0, numImages));
        
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

  const renderTooltip = (text) => {
    return null; // Hide all tooltips
  };

  const toggleSelect = idx => {
    setSelectedForRegen(sel => sel.includes(idx) ? sel.filter(i => i !== idx) : [...sel, idx]);
  };

  const handleRegenerateSelected = () => {
    setRegeneratingImages(selectedImages);
    // For each selected image, generate a new prompt and update the image (simulate new image)
    const newImages = images.map((img, idx) =>
      selectedImages.includes(idx)
        ? { ...img, prompt: generateNewPrompt(), url: getNewImageUrl() }
        : img
    );
    setTimeout(() => {
      setImages(newImages);
      setRegeneratingImages([]);
      setSelectedImages([]);
    }, 2000);
  };

  return (
    <div className='container'>
      {/* Form Section - 20% */}
      <div className="form-section">
        <h1 className="main-title" style={{ marginTop: '18px' }}>AD Generator 2.0</h1>
        <form onSubmit={handleSubmit} className='form'>
          <div className="upload-section">
            <div 
              className={`upload-box ${dragOver ? 'drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📁</div>
              <h3>Upload Product Images</h3>
              <div className="upload-instructions">
                <strong>Choose files</strong> or <strong>drag and drop</strong> your product images here
                <br />
                Supports JPG, PNG, GIF • Max 10MB per file
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              {dragOver && (
                <div className="drag-indicator">
                  Drop images here
                </div>
              )}
            </div>

            {images.length > 0 && (
              <>
                <div className="image-preview-container">
                  {images.map((file, index) => (
                    <div key={index} className="image-preview">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Preview ${index + 1}`}
                      />
                      <button
                        className="image-preview-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="file-info">
                  ✓ {images.length} image{images.length !== 1 ? 's' : ''} selected
                </div>
              </>
            )}
          </div>

          <div className={`form-group ${fieldErrors.vertical ? 'has-error' : vertical ? 'has-success' : ''}`}>
            <label>
              Vertical
            </label>
            <input
              type="text"
              value={vertical}
              onChange={handleVerticalChange}
              placeholder="Enter vertical (e.g., Health & Wellness)"
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
            <label>
              Angle
            </label>
            <input
              type="text"
              value={angle}
              onChange={handleAngleChange}
              placeholder="Enter creative angle (e.g., Problem-solution approach)"
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
            <label>
              Sentiment
            </label>
            <select
              value={sentiment}
              onChange={handleSentimentChange}
              required
            >
              <option value="">Select a sentiment...</option>
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

          <div className="form-group form-row">
            <label style={{ width: '100%' }}>Age Range & Number of Images</label>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: 80 }}>
                <select value={ageFrom} onChange={e => setAgeFrom(Number(e.target.value))} style={{ width: '100%', paddingRight: 28, backgroundPosition: 'right 8px center' }}>
                  {[...Array(48)].map((_, i) => (
                    <option key={i} value={i + 18}>{i + 18}</option>
                  ))}
                </select>
                <span className="custom-select-arrow" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>&#9662;</span>
              </div>
              <span style={{ fontWeight: 600, color: '#667eea' }}>to</span>
              <div style={{ position: 'relative', width: 80 }}>
                <select value={ageTo} onChange={e => setAgeTo(Number(e.target.value))} style={{ width: '100%', paddingRight: 28, backgroundPosition: 'right 8px center' }}>
                  {[...Array(48)].map((_, i) => (
                    <option key={i} value={i + 18}>{i + 18}</option>
                  ))}
                </select>
                <span className="custom-select-arrow" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>&#9662;</span>
              </div>
              <span style={{ marginLeft: 10, fontWeight: 600 }}>Images:</span>
              <div style={{ position: 'relative', width: 80 }}>
                <select
                  value={numImages}
                  onChange={e => setNumImages(Number(e.target.value))}
                  style={{ width: '100%', paddingRight: 28, backgroundPosition: 'right 8px center' }}
                  className="custom-select"
                >
                  {[...Array(20)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <span className="custom-arrow" />
              </div>
            </div>
          </div>

          {error && <div className='error'>{error}</div>}

          <button type='submit' disabled={loading} className={`generate-button ${loading ? 'loading' : ''}`}>
            {loading ? (
              <span className="loading-dots">Generating</span>
            ) : (
              `Generate ${numImages} Image${numImages !== 1 ? 's' : ''}`
            )}
          </button>
        </form>
      </div>

      {/* Results Section - 80% */}
      <div className="results-section">
        {/* Progress Bar at Top of Results Section */}
        {showProgress && (
          <div className="progress-bar-horizontal-wrapper improved">
            <div className="progress-bar-horizontal improved">
              <div className="progress-bar-horizontal-fill improved" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="progress-bar-horizontal-steps improved">
              {progressSteps.map((step, index) => (
                <div
                  key={index}
                  className={`progress-bar-horizontal-step improved ${
                    index < currentStep ? 'completed' : index === currentStep ? 'active' : ''
                  }`}
                >
                  {step === 'Creating new images with AI' ? 'Creating Images' : step}
                </div>
              ))}
            </div>
            <div className="progress-bar-horizontal-info improved">
              <span>{progressMessage.replace('Creating new images with AI', 'Creating Images')}</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        )}
        {/* Loading Skeletons */}
        {loading && !results.length && (
          <div className='results'>
            <div className='images'>
              {Array.from({ length: numImages }).map((_, index) => (
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
              Upload your images and fill out the form to generate professional marketing content with AI.
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
            <div className="results-header-row">
              <div className="results-header-folder">
                <span className="results-folder-icon">📦</span>
              </div>
              <div className="results-header-buttons">
                <button className="export-all-btn" onClick={handleExportAll} disabled={loading}>
                  <span role="img" aria-label="box" style={{ marginRight: 6 }}>📦</span>
                  Export all as zip
                </button>
                <button className="results-header-btn regen-btn" style={{ width: 'auto', padding: '12px 28px', fontSize: '1.05rem' }} onClick={() => setSelectMode(sm => !sm)} type="button">
                  {selectMode ? 'Cancel Selection' : 'Select to Regenerate'}
                </button>
              </div>
            </div>
            <div className='images'>
              {results.map((url, idx) => (
                <div
                  key={idx}
                  className={`image-card${selectMode ? ' selectable' : ''}${selectedForRegen.includes(idx) ? ' selected' : ''}`}
                  onClick={selectMode ? () => toggleSelect(idx) : undefined}
                  style={selectMode ? { cursor: 'pointer', border: selectedForRegen.includes(idx) ? '2px solid #667eea' : '2px solid transparent', position: 'relative' } : {}}
                >
                  <div className="image-container" style={{ position: 'relative' }}>
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedForRegen.includes(idx)}
                        onChange={() => toggleSelect(idx)}
                        className="image-select-checkbox"
                        style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, width: 22, height: 22, accentColor: '#667eea', borderRadius: 4 }}
                        onClick={e => e.stopPropagation()}
                      />
                    )}
                    {regenerating.includes(idx) && (
                      <div className="regenerating-overlay">
                        <div className="regenerating-spinner"></div>
                      </div>
                    )}
                    <LazyImage
                      src={url}
                      alt={`Generated ${idx + 1}`}
                      className="clickable-image"
                      onClick={selectMode ? undefined : () => handleImageClick(url, prompts[idx])}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                    <a
                      href={url}
                      download
                      className="download-image-btn"
                      title="Download image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                      Download
                    </a>
                  </div>
                  {prompts[idx] && (
                    <div className="prompt-text" style={{ cursor: 'default', userSelect: 'text' }}>
                      {prompts[idx]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selectMode && selectedForRegen.length > 0 && (
              <button className="generate-button" style={{ width: 'auto', padding: '12px 28px', fontSize: '1.05rem', background: 'linear-gradient(135deg, #ff4757 0%, #ff6b81 100%)' }} onClick={handleRegenerateSelected} type="button">
                Regenerate Selected
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={selectedImage.url} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '80vh', borderRadius: 16 }} />
            {selectedImage.prompt && (
              <div className="prompt-text" style={{ marginTop: 12 }}>{selectedImage.prompt}</div>
            )}
            <button className="generate-button" style={{ marginTop: 18 }} onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
