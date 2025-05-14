const TemplateConfig = {
  professional: {
    colors: {
      background: 'FFFFFF',
      header: '2C3E50',
      text: '2C3E50',
      accent: '3498DB'
    },
    fonts: {
      title: { name: 'Arial', size: 40, bold: true }, // h1 sized
      body: { name: 'Calibri', size: 18 }
    },
    layouts: [
      {
        name: "Title with Right Image",
        title: { x: 0.5, y: 0.3, w: 9, align: 'left', tag: 'h1' },
        image: { x: 5.5, y: 1.8, w: 4, h: 5.5 },
        content: { x: 0.5, y: 1.8, w: 4.5 }
      }
    ],
    transitions: {
      in: 'fade',
      out: 'fade'
    }
  },
  creative: {
    colors: {
      background: 'F5F7FA',
      header: 'E74C3C',
      text: '2C3E50',
      accent: 'E67E22'
    },
    fonts: {
      title: { name: 'Impact', size: 42, bold: true, color: 'FFFFFF' }, // h1 style
      body: { name: 'Comic Sans MS', size: 20 }
    },
    layouts: [
      {
        name: "Creative Split View",
        title: { x: 0.5, y: 0.3, w: 9, align: 'center', tag: 'h1' },
        image: { x: 5.5, y: 1.8, w: 4, h: 5.5 },
        content: { x: 0.5, y: 1.8, w: 4.5, align: 'left' }
      }
    ],
    transitions: {
      in: 'circle',
      out: 'checker'
    }
  },
  minimal: {
    colors: {
      background: 'FFFFFF',
      header: '000000',
      text: '333333',
      accent: '999999'
    },
    fonts: {
      title: { name: 'Helvetica', size: 36, bold: false }, // h1-light
      body: { name: 'Helvetica', size: 16, color: '555555' }
    },
    layouts: [
      {
        name: "Minimal Split",
        title: { x: 0.5, y: 0.3, w: 9, align: 'left', tag: 'h1' },
        image: { x: 5.5, y: 1.8, w: 4, h: 5.5 },
        content: { x: 0.5, y: 1.8, w: 4.5 }
      }
    ],
    transitions: {
      in: 'fade',
      out: 'none'
    }
  }
};

export default TemplateConfig;