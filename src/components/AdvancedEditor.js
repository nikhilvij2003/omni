import { useEffect, useRef, useState, } from 'react';
import { SketchPicker } from 'react-color';
import { FaExpand, FaCompress, FaSave } from 'react-icons/fa';
import axios from 'axios';

const AdvancedEditor = ({ html, css, js, onUpdate }) => {
  const iframeRef = useRef();
  const [selectedElement, setSelectedElement] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cssProperties, setCssProperties] = useState({
    color: '',
    backgroundColor: '',
    fontSize: '',
    width: '',
    height: '',
    padding: '',
    margin: '',
    border: ''
  });

  const generateFullHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <style id="editor-styles">
          ${css}
          .selected-element { outline: 2px dashed #3B82F6 !important; }
        </style>
      </head>
      <body>
        ${html}
        <script id="editor-scripts">
          try {
            ${js}
          } catch(e) {
            console.error('Editor script error:', e);
          }
        </script>
      </body>
    </html>
  `;

  const extractStyles = (element) => {
    if (!element) return;
    const computed = getComputedStyle(element);
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      fontSize: computed.fontSize,
      width: computed.width,
      height: computed.height,
      padding: computed.padding,
      margin: computed.margin,
      border: computed.border
    };
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    setSelectedElement(null);
    if (!iframe) return;

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const handleClick = (e) => {
        doc.querySelectorAll('.selected-element').forEach(el => {
          el.classList.remove('selected-element');
        });
        
        e.target.classList.add('selected-element');
        setSelectedElement(e.target);
        setCssProperties(extractStyles(e.target));
      };

      doc.addEventListener('click', handleClick);

      return () => {
        doc.removeEventListener('click', handleClick);
      };
    };

    const blob = new Blob([generateFullHtml()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      URL.revokeObjectURL(url);
    };
  }, [html, css, js]);

  const handleStyleChange = (property, value) => {
    if (!selectedElement) return;
    
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    selectedElement.style[property] = value;
    setCssProperties(prev => ({
      ...prev,
      [property]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const doc = iframeRef.current?.contentDocument;
    if (!doc) {
      setIsSaving(false);
      return;
    }

    try {
      const styles = doc.querySelector('#editor-styles').innerHTML;
      const scripts = doc.querySelector('#editor-scripts').innerHTML;
      const updatedHtml = doc.body.innerHTML.replace(/<script id="editor-scripts">[\s\S]*?<\/script>/, '');

      // Update parent component
      if (onUpdate) {
        onUpdate({
          html: updatedHtml,
          css: styles,
          js: scripts
        });
      }

      // Save to backend
      await axios.post('http://localhost:5000/api/project/save', {
        html: updatedHtml,
        css: styles,
        js: scripts,
      });

      alert('Project saved successfully!');
    } catch (err) {
      console.error('Save failed:', err);
      alert('Error saving project');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex flex-col ${isExpanded ? 'fixed inset-0 z-50 bg-white p-4' : 'h-[600px]'}`}>
      <div className="flex justify-between items-center bg-gray-100 p-2 border-b border-gray-300">
        <h3 className="font-bold">Preview</h3>
        <div className="flex gap-2">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`p-1 ${isSaving ? 'text-gray-400' : 'text-gray-600 hover:text-green-600'}`}
            title="Save Project"
          >
            <FaSave />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-600 hover:text-blue-600"
          >
            {isExpanded ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className={`flex-1 ${isExpanded ? 'h-[calc(100vh-50px)]' : 'h-full'}`}>
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Advanced Editor"
          />
        </div>
        
        <div className="w-80 border-l border-gray-300 bg-white overflow-y-auto">
          <div className="p-4">
            <h3 className="font-bold mb-4">Element Properties</h3>
            
            {selectedElement ? (
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Tag: {selectedElement.tagName}</label>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Text Color</label>
                    <SketchPicker
                      color={cssProperties.color}
                      onChangeComplete={(color) => handleStyleChange('color', color.hex)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Background</label>
                    <SketchPicker
                      color={cssProperties.backgroundColor}
                      onChangeComplete={(color) => handleStyleChange('backgroundColor', color.hex)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Font Size</label>
                    <input
                      type="text"
                      value={cssProperties.fontSize}
                      onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Width</label>
                      <input
                        type="text"
                        value={cssProperties.width}
                        onChange={(e) => handleStyleChange('width', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Height</label>
                      <input
                        type="text"
                        value={cssProperties.height}
                        onChange={(e) => handleStyleChange('height', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Padding</label>
                      <input
                        type="text"
                        value={cssProperties.padding}
                        onChange={(e) => handleStyleChange('padding', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Margin</label>
                      <input
                        type="text"
                        value={cssProperties.margin}
                        onChange={(e) => handleStyleChange('margin', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Border</label>
                    <input
                      type="text"
                      value={cssProperties.border}
                      onChange={(e) => handleStyleChange('border', e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Click on an element to edit its properties</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedEditor;