import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Upload, Save, Trash2, Download, Plus, Moon, Sun, Settings, Grid3X3 } from 'lucide-react';

const DigitalBinder = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentBinder, setCurrentBinder] = useState(0);
  const [binders, setBinders] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showBinderModal, setShowBinderModal] = useState(false);
  const [newBinderName, setNewBinderName] = useState('');
  const [dragOver, setDragOver] = useState(null);
  const [cardSize, setCardSize] = useState(1); // 0.5 to 2 scale
  const [showSettings, setShowSettings] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const totalPages = 20;

  // Initialize binders with one default binder
  useEffect(() => {
    if (binders.length === 0) {
      const initialBinder = {
        name: 'My Collection',
        pages: Array(totalPages).fill().map(() => {
          return Array(9).fill().map(() => ({
            images: [], // Changed to array to store multiple images
            caption: '',
            activeImageIndex: 0 // Track which image is currently displayed
          }));
        })
      };
      setBinders([initialBinder]);
    }
  }, [binders.length, totalPages]);

  const handleImageUpload = (pageIndex, slotIndex) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        processImageFile(file, pageIndex, slotIndex);
      }
    };
    input.click();
  };

  const processImageFile = (file, pageIndex, slotIndex) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const newBinders = [...binders];
      const slot = newBinders[currentBinder].pages[pageIndex][slotIndex];
      
      // Add new image to the images array
      slot.images.push(event.target.result);
      // Set the new image as active if it's the first one
      if (slot.images.length === 1) {
        slot.activeImageIndex = 0;
      }
      
      setBinders(newBinders);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e, pageIndex, slotIndex) => {
    e.preventDefault();
    setDragOver(`${pageIndex}-${slotIndex}`);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(null);
  };

  const handleDrop = (e, pageIndex, slotIndex) => {
    e.preventDefault();
    setDragOver(null);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      processImageFile(imageFile, pageIndex, slotIndex);
    }
  };

  const handleCaptionChange = (pageIndex, slotIndex, value) => {
    const newBinders = [...binders];
    newBinders[currentBinder].pages[pageIndex][slotIndex] = {
      ...newBinders[currentBinder].pages[pageIndex][slotIndex],
      caption: value
    };
    setBinders(newBinders);
  };

  const handlePageChange = (delta) => {
    const newPage = Math.max(0, Math.min(totalPages - 1, currentPage + delta));
    setCurrentPage(newPage);
  };

  const removeImage = (pageIndex, slotIndex, imageIndex = null) => {
    const newBinders = [...binders];
    const slot = newBinders[currentBinder].pages[pageIndex][slotIndex];
    
    if (imageIndex !== null) {
      // Remove specific image
      slot.images.splice(imageIndex, 1);
      // Adjust active index if needed
      if (slot.activeImageIndex >= slot.images.length) {
        slot.activeImageIndex = Math.max(0, slot.images.length - 1);
      }
    } else {
      // Remove all images (legacy support)
      slot.images = [];
      slot.activeImageIndex = 0;
    }
    
    setBinders(newBinders);
  };

  const setActiveImage = (pageIndex, slotIndex, imageIndex) => {
    const newBinders = [...binders];
    newBinders[currentBinder].pages[pageIndex][slotIndex].activeImageIndex = imageIndex;
    setBinders(newBinders);
    setHoveredSlot(null);
  };

  const exportCollection = () => {
    const data = {
      binders: binders,
      darkMode: darkMode,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportName = 'digital_binders_' + new Date().toISOString().slice(0, 10);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportName + '.json');
    linkElement.click();
  };

  const importCollection = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (data.binders) {
              setBinders(data.binders);
              if (data.darkMode !== undefined) {
                setDarkMode(data.darkMode);
              }
              setCurrentBinder(0);
              setCurrentPage(0);
            }
          } catch (error) {
            alert('Error importing collection. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const createNewBinder = () => {
    if (newBinderName.trim()) {
      const newBinder = {
        name: newBinderName.trim(),
        pages: Array(totalPages).fill().map(() => {
          return Array(9).fill().map(() => ({
            image: null,
            caption: ''
          }));
        })
      };
      setBinders([...binders, newBinder]);
      setCurrentBinder(binders.length);
      setCurrentPage(0);
      setNewBinderName('');
      setShowBinderModal(false);
    }
  };

  const deleteBinder = (binderIndex) => {
    if (binders.length > 1 && window.confirm(`Delete "${binders[binderIndex].name}"? This cannot be undone.`)) {
      const newBinders = binders.filter((_, index) => index !== binderIndex);
      setBinders(newBinders);
      setCurrentBinder(Math.min(currentBinder, newBinders.length - 1));
    }
  };

  const getItemNumber = (pageIndex, slotIndex) => {
    return pageIndex * 9 + slotIndex + 1;
  };

  // Only render once binders are initialized
  if (binders.length === 0) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const binderBackground = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';
  const cardBackground = darkMode ? 'bg-gray-800' : 'bg-white';
  const buttonBackground = darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300';
  const modalBackground = darkMode ? 'bg-gray-800' : 'bg-white';

  return (
    <div className={`min-h-screen ${binderBackground} ${textColor} transition-colors duration-300`}>
      {/* Header */}
      <header className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Digital Collection Binder</h1>
          <select 
            value={currentBinder} 
            onChange={(e) => {
              setCurrentBinder(parseInt(e.target.value));
              setCurrentPage(0);
            }}
            className={`${cardBackground} ${textColor} p-2 rounded-lg border`}
          >
            {binders.map((binder, index) => (
              <option key={index} value={index}>{binder.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            className={`${buttonBackground} p-2 rounded-lg flex items-center gap-2`}
            onClick={() => setShowBinderModal(true)}
          >
            <Plus size={16} />
            New Binder
          </button>
          <button 
            className={`${buttonBackground} p-2 rounded-lg flex items-center gap-2`}
            onClick={() => setShowSettings(true)}
          >
            <Settings size={16} />
            Settings
          </button>
          <button 
            className={`${buttonBackground} p-2 rounded-lg flex items-center gap-2`}
            onClick={exportCollection}
          >
            <Save size={16} />
            Export
          </button>
          <button 
            className={`${buttonBackground} p-2 rounded-lg flex items-center gap-2`}
            onClick={importCollection}
          >
            <Download size={16} />
            Import
          </button>
          <button 
            className={`${buttonBackground} p-2 rounded-lg flex items-center gap-2`}
            onClick={toggleDarkMode}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Binder Page Navigation */}
      <div className="flex justify-between items-center p-4">
        <button 
          onClick={() => handlePageChange(-1)} 
          disabled={currentPage === 0}
          className={`${buttonBackground} p-2 rounded-lg flex items-center gap-2 ${currentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ChevronLeft />
          Previous
        </button>
        <div className="text-lg font-medium">
          <span className="text-sm opacity-75">Items {getItemNumber(currentPage, 0)}-{getItemNumber(currentPage, 8)} • </span>
          Page {currentPage + 1} of {totalPages}
        </div>
        <button 
          onClick={() => handlePageChange(1)} 
          disabled={currentPage === totalPages - 1}
          className={`${buttonBackground} p-2 rounded-lg flex items-center gap-2 ${currentPage === totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Next
          <ChevronRight />
        </button>
      </div>

      {/* Binder Grid */}
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-3 gap-4" style={{ transform: `scale(${cardSize})`, transformOrigin: 'center top' }}>
          {binders[currentBinder].pages[currentPage].map((slot, index) => {
            const itemNumber = getItemNumber(currentPage, index);
            const hasImages = slot.images && slot.images.length > 0;
            const activeImage = hasImages ? slot.images[slot.activeImageIndex] : null;
            const isHovered = hoveredSlot === `${currentPage}-${index}`;
            
            return (
              <div 
                key={index} 
                className={`relative ${cardBackground} p-2 rounded-lg shadow-md flex flex-col`}
                onMouseEnter={() => hasImages && slot.images.length > 1 && setHoveredSlot(`${currentPage}-${index}`)}
                onMouseLeave={() => setHoveredSlot(null)}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs opacity-60 font-medium">#{itemNumber}</div>
                  {hasImages && slot.images.length > 1 && (
                    <div className="text-xs bg-blue-500 text-white px-1 rounded">
                      {slot.images.length} imgs
                    </div>
                  )}
                </div>
                <div 
                  className={`aspect-[3/4] rounded border-2 ${
                    dragOver === `${currentPage}-${index}` 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-dashed border-gray-300'
                  } mb-2 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-400 transition-all relative`}
                  onClick={() => handleImageUpload(currentPage, index)}
                  onDragOver={(e) => handleDragOver(e, currentPage, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, currentPage, index)}
                >
                  {activeImage ? (
                    <div className="relative w-full h-full">
                      <img 
                        src={activeImage} 
                        alt={`Item ${itemNumber}`} 
                        className="w-full h-full object-contain"
                      />
                      <button 
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(currentPage, index, slot.activeImageIndex);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Upload size={24} />
                      <span className="text-sm mt-2">
                        {dragOver === `${currentPage}-${index}` ? 'Drop image here' : 'Upload or Drop Image'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Multiple Images Hover Menu */}
                {isHovered && slot.images.length > 1 && (
                  <div className="absolute top-8 left-full ml-2 bg-white dark:bg-gray-800 border rounded-lg shadow-xl p-2 z-50 min-w-48">
                    <div className="text-xs font-medium mb-2 opacity-75">Select main image:</div>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {slot.images.map((img, imgIndex) => (
                        <div
                          key={imgIndex}
                          className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                            imgIndex === slot.activeImageIndex ? 'border-blue-500' : 'border-gray-300'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImage(currentPage, index, imgIndex);
                          }}
                        >
                          <img 
                            src={img} 
                            alt={`Version ${imgIndex + 1}`}
                            className="w-full h-16 object-cover"
                          />
                          <button
                            className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(currentPage, index, imgIndex);
                            }}
                          >
                            ×
                          </button>
                          {imgIndex === slot.activeImageIndex && (
                            <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs text-center py-0.5">
                              Main
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <input
                  type="text"
                  value={slot.caption}
                  onChange={(e) => handleCaptionChange(currentPage, index, e.target.value)}
                  placeholder={`Item #${itemNumber} caption...`}
                  className={`w-full p-1 rounded text-sm ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'} border-0 focus:ring-2 focus:ring-blue-400`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${modalBackground} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings size={20} />
              Binder Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Card Size</label>
                <div className="flex items-center gap-3">
                  <span className="text-sm opacity-75">Small</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={cardSize}
                    onChange={(e) => setCardSize(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm opacity-75">Large</span>
                </div>
                <div className="text-center text-sm opacity-60 mt-1">
                  Current: {Math.round(cardSize * 100)}%
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm opacity-75">
                  <Grid3X3 size={16} />
                  <span>All cards resize together</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6 justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className={`${buttonBackground} px-4 py-2 rounded-lg`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Binder Modal */}
      {showBinderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${modalBackground} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
            <h3 className="text-lg font-bold mb-4">Create New Binder</h3>
            <input
              type="text"
              value={newBinderName}
              onChange={(e) => setNewBinderName(e.target.value)}
              placeholder="Enter binder name..."
              className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'} focus:ring-2 focus:ring-blue-400`}
              onKeyPress={(e) => e.key === 'Enter' && createNewBinder()}
            />
            <div className="flex gap-2 mt-4 justify-end">
              <button
                onClick={() => {
                  setShowBinderModal(false);
                  setNewBinderName('');
                }}
                className={`${buttonBackground} px-4 py-2 rounded-lg`}
              >
                Cancel
              </button>
              <button
                onClick={createNewBinder}
                disabled={!newBinderName.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalBinder;