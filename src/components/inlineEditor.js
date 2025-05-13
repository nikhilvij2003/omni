import { useEffect, useRef, useState } from 'react';

const InlineEditor = ({ html, css, js, onUpdate }) => {
  const iframeRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);

  const generateFullHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <style id="editor-styles">${css}</style>
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

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.designMode = 'on';
      setIsLoaded(true);

      const extractContent = () => {
        const stylesEl = doc.querySelector('#editor-styles');
        const scriptsEl = doc.querySelector('#editor-scripts');
        
        return {
          html: doc.body.innerHTML.replace(/<script id="editor-scripts">[\s\S]*?<\/script>/, ''),
          css: stylesEl?.innerHTML || '',
          js: scriptsEl?.innerHTML.replace(/^try\s*{([\s\S]*?)}\s*catch.*$/m, '$1') || ''
        };
      };

      const updateContent = () => {
        const { html, css, js } = extractContent();
        onUpdate({ html, css, js });
      };

      doc.addEventListener('input', updateContent);
      doc.addEventListener('click', (e) => {
        e.target.style.outline = '2px solid #3B82F6';
        e.target.contentEditable = true;
      });
      doc.addEventListener('blur', (e) => {
        e.target.style.outline = '';
      }, true);
    };

    const blob = new Blob([generateFullHtml()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      URL.revokeObjectURL(url);
    };
  }, []);

  // Update iframe content when props change
  useEffect(() => {
    if (!isLoaded) return;
    
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!doc) return;

    const stylesEl = doc.querySelector('#editor-styles');
    const scriptsEl = doc.querySelector('#editor-scripts');
    
    if (stylesEl) stylesEl.innerHTML = css;
    if (scriptsEl) scriptsEl.innerHTML = `try { ${js} } catch(e) { console.error(e); }`;
    
    // Only update body content if html has changed
    const currentBodyHtml = doc.body.innerHTML
      .replace(/<script id="editor-scripts">[\s\S]*?<\/script>/, '');
    if (currentBodyHtml !== html) {
      doc.body.innerHTML = html + 
        `<script id="editor-scripts">try { ${js} } catch(e) { console.error(e); }</script>`;
    }
  }, [html, css, js, isLoaded]);

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        background: 'white'
      }}
      title="Inline Editor"
    />
  );
};

export default InlineEditor;