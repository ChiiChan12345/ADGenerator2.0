import React, { useState } from 'react';
import './App.css';
import promptGuide from './PromptFORGPT';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function App() {
  const [images, setImages] = useState([]);
  const [vertical, setVertical] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [angle, setAngle] = useState('');
  const [sentiment, setSentiment] = useState('');
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

  const handleImageChange = event => {
    const files = Array.from(event.target.files);
    setImages(files);
    setError('');
  };

  const handleVerticalChange = e => {
    setVertical(e.target.value);
    setError('');
  };

  const handleAgeGroupChange = e => {
    setAgeGroup(e.target.value);
    setError('');
  };

  const handleAngleChange = e => {
    setAngle(e.target.value);
    setError('');
  };

  const handleSentimentChange = e => {
    setSentiment(e.target.value);
    setError('');
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
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while processing the images.');
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
          <div className='upload-box'>
            <h3>Upload Images</h3>
            <input
              type='file'
              accept='image/*'
              multiple
              onChange={handleImageChange}
              className='file-input'
            />
            {images.length > 0 && <p className='file-info'>{images.length} image(s) selected</p>}
          </div>
        </div>

        <div className='form-group'>
          <label htmlFor='vertical'>Vertical:</label>
          <input
            type='text'
            id='vertical'
            value={vertical}
            onChange={handleVerticalChange}
            placeholder='Enter vertical'
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='angle'>Angle:</label>
          <input
            type='text'
            id='angle'
            value={angle}
            onChange={handleAngleChange}
            placeholder='Enter angle'
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='sentiment'>Sentiment:</label>
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
        </div>

        <div className='form-group'>
          <label htmlFor='ageGroup'>Age Group:</label>
          <input
            type='text'
            id='ageGroup'
            value={ageGroup}
            onChange={handleAgeGroupChange}
            placeholder='Enter age group'
            required
          />
        </div>

        {error && <div className='error'>{error}</div>}

        <button type='submit' disabled={loading} className='generate-button'>
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      {results.length > 0 && (
        <div className='results'>
          <h2>Generated Images</h2>
          <button
            className='export-all-btn'
            onClick={handleExportAll}
            style={{ marginBottom: '1rem' }}
          >
            Export All
          </button>
          <div className='images'>
            {results.map((url, idx) => (
              <div key={url} className='image-block'>
                <img
                  src={url}
                  alt={`Generated ${idx + 1}`}
                  onClick={() => handleImageClick(url, prompts[idx])}
                  className='clickable-image'
                />
                <a
                  href={url}
                  download
                  target='_blank'
                  rel='noopener noreferrer'
                  className='download-btn'
                >
                  Download
                </a>
                {prompts[idx] && <div className='prompt-caption'>{prompts[idx]}</div>}
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
            <img src={selectedImage.url} alt='Enlarged view' className='modal-image' />
            {selectedImage.prompt && <div className='modal-prompt'>{selectedImage.prompt}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
