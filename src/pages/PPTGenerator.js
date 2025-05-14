import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PPTX from 'pptxgenjs';
import TemplateConfig from './template.js';
import BASE_URL from '../config/api.js';


export default function PPTGenerator() {
  const [prompt, setPrompt] = useState('');
  const [template, setTemplate] = useState('professional');
  const [animation, setAnimation] = useState('fade');
  const [slides, setSlides] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customizations, setCustomizations] = useState({});
  // const [image,setImage] = useState({});

  const navigate = useNavigate();

  // const applyTemplateStyles = (pptx) => {
  //   const { colors, layouts } = TemplateConfig[template];
  //   pptx.defineSlideMaster({
  //     title: 'MASTER_SLIDE',
  //     background: { color: colors.background },
  //     objects: [
  //       { rect: { x: 0, y: 0, w: '100%', h: 0.5, fill: colors.header } },
  //     ],
  //     slideNumber: { x: 0.3, y: '90%' }
  //   });
  //   return layouts;
  // };
  const applyTemplateStyles = (pptx, template) => {
    const config = TemplateConfig[template];
    if (!config) throw new Error(`Template '${template}' not found`);

    const { colors, fonts, layouts, transitions } = config;

    pptx.defineSlideMaster({
      title: 'MASTER_SLIDE',
      background: { color: colors.background },
      objects: [
        {
          rect: {
            x: 0,
            y: 0,
            w: '100%',
            h: 0.5,
            fill: colors.header
          }
        }
      ],
      slideNumber: { x: 0.3, y: '90%', color: colors.text, fontSize: 10 }
    });

    // You might apply transitions and fonts later during slide creation
    return {
      layouts,
      fonts,
      colors,
      transitions
    };
  };


  // const fetchImage = async (slideIndex, slides) => {
  //   try {
  //     const newImage = await axios.get(`${BASE_URL}/api/ppt/unsplash?keyword=${slides.content}`);
  //     setImage(prev => ({
  //       ...prev,
  //       [slideIndex]: { ...prev[slideIndex], image: newImage.data.url }
  //     }));
  //     console.log(image);
  //   } catch (err) {
  //     console.error('Image load failed:', err);
  //   }

  // }
const generatePPT = async () => {
  // fetchImage();
  const pptx = new PPTX();
  const layouts = applyTemplateStyles(pptx,template);

  slides.forEach((slide, index) => {
    const currentSlide = pptx.addSlide('MASTER_SLIDE');
    const layout = layouts[index % layouts.length];


    if (!slide || typeof slide.title === 'undefined') {
    console.error(`Slide at index ${index} is missing or invalid:`, slide);
    return; // Skip this slide
  }

    // Add title
    currentSlide.addText(slide.title || "Untitled Slide", {
      x: layout.title.x,
      y: layout.title.y,
      fontSize: 24,
      color: TemplateConfig[template].colors.text
    });

    // Add image if available (use 'path' for the URL)
    const img = customizations[index]?.image;
    if (img) {
      currentSlide.addImage({
        path: img,           // use 'path' for remote URL&#8203;:contentReference[oaicite:8]{index=8}
        x: layout.image.x,
        y: layout.image.y,
        w: layout.image.w,
        h: layout.image.h
      });
    }

    // Add content
    currentSlide.addText(customizations[index]?.content || slide.content, {
      x: layout.content.x,
      y: layout.content.y,
      fontSize: 18,
      color: TemplateConfig[template].colors.text
    });
  });

  // Wait for PPTX to finish writing (with images embedded)
  await pptx.writeFile('custom-presentation.pptx');
};



  const generateWithAI = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/api/ppt/generate`, {
        prompt,
        template,
        animationStyle: animation
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setSlides(response.data.slides);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveEdits = (index, field, value) => {
    const updatedSlides = [...slides];
    updatedSlides[index][field] = value;
    setSlides(updatedSlides);
  };




const handleImageChange = async (slideIndex, keyword) => {
  try {
    const encodedKey = encodeURIComponent(keyword); 
    const response = await axios.get(`${BASE_URL}/api/ppt/unsplash?keyword=${encodedKey}`);

    // Fetch actual image as Blob
    const imgResponse = await axios.get(response.data.url, { responseType: 'blob' });

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result;  // base64 encoded image
      setCustomizations(prev => ({
        ...prev,
        [slideIndex]: { 
          ...prev[slideIndex],
          image: base64data  // now image is base64
        }
      }));
    };
    reader.readAsDataURL(imgResponse.data);
  } catch (err) {
    console.error('Image load failed:', err);
  }
};

useEffect(() => {
  slides.forEach((slide, i) => {
    const keyword = slide?.title || "random";
    setCustomizations(prev => ({
      ...prev,
      [i]: { ...prev[i], keyword }
    }));
    handleImageChange(i, keyword);
  });
}, [slides]);



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl">
        <button 
          onClick={() => navigate(-1)} 
          className="text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← Back
        </button>

        {!isEditing ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-gray-800">
              AI Presentation Generator
            </h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your presentation topic..."
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                <select 
                  value={template} 
                  onChange={(e) => setTemplate(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="professional">Professional</option>
                  <option value="creative">Creative</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-black-700 mb-1">Animation</label>
                <select 
                  value={animation} 
                  onChange={(e) => setAnimation(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fade">Fade</option>
                  <option value="zoom">Zoom</option>
                  <option value="fly-in">Fly In</option>
                </select>
              </div>
            </div>
            <button 
              onClick={generateWithAI} 
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
                isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-gray-800">Edit Your Presentation</h2>
            {slides.map((slide, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <input
                  value={slide.title}
                  onChange={(e) => saveEdits(i, 'title', e.target.value)}
                  className="w-full border-b border-gray-300 p-2 mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Slide title"
                />
                <textarea
                  value={slide.content}
                  onChange={(e) => saveEdits(i, 'content', e.target.value)}
                  className="w-full h-24 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Slide content"
                />

                <input
                  // value={customizations[i]?.keyword || ""}
                  value= {slide.title || "random"}
                  type="text"
                  placeholder="Enter image keyword"
                  onClick={(e) => {
                    const keyword = e.target.value;
                    setCustomizations(prev => ({
                      ...prev,
                      [i]: { ...prev[i], keyword }
                    }));
                    handleImageChange(i, keyword);
                  }}
                  className="w-full mt-2 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                {(customizations[i]?.image || slide.image) && (
                  <img 
                    src={customizations[i]?.image || slide.image} 
                    alt="Slide Preview"
                    className="mt-2 rounded-lg max-w-full h-auto border"
                  />
                )}
              </div>
            ))}
            <div className="flex justify-between">
              <button 
                onClick={() => setIsEditing(false)} 
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all"
              >
                Back to Generator
              </button>
              <button 
                onClick={generatePPT} 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all"
              >
                Save and Download
              </button>
            </div>
          </div>
        )}

        {slides.length > 0 && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            Edit Presentation
          </button>
        )}
      </div>
    </div>
  );
}
