const TemplateConfig = {
  professional: {
    colors: {
      background: 'FFFFFF',
      header: '2C3E50',
      text: '2C3E50',
      accent: '3498DB'
    },
    fonts: {
      title: { name: 'Arial', size: 36, bold: true },
      body: { name: 'Calibri', size: 18 }
    },
    layouts: [
      {
        name: "Title + Image Right",
        title: { x: 1, y: 0.5, w: 5 },
        image: { x: 6.5, y: 1.5, w: 4, h: 4.5 },
        content: { x: 1, y: 1.5, w: 5 }
      },
      {
        name: "Title + Full Image",
        title: { x: 1, y: 0.3, w: 8 },
        image: { x: 0.5, y: 1.5, w: 9, h: 5 },
        content: { x: 1, y: 6.8, w: 8 }
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
      title: { name: 'Impact', size: 40, bold: true, color: 'FFFFFF' },
      body: { name: 'Comic Sans MS', size: 20 }
    },
    layouts: [
      {
        name: "Centered Layout",
        title: { x: 0, y: 0.5, w: '100%', align: 'center' },
        image: { x: 2.5, y: 2, w: 5, h: 4 },
        content: { x: 1, y: 6.5, w: 8, align: 'center' }
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
      title: { name: 'Helvetica', size: 32, bold: false },
      body: { name: 'Helvetica', size: 16, color: '555555' }
    },
    layouts: [
      {
        name: "Simple Two Column",
        title: { x: 1, y: 0.3, w: 8 },
        image: { x: 1, y: 1.5, w: 3.5, h: 4 },
        content: { x: 5, y: 1.5, w: 4 }
      }
    ],
    transitions: {
      in: 'fade',
      out: 'none'
    }
  }
};

module.exports = TemplateConfig;