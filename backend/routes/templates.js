const express = require('express');
const router = express.Router();
const {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  setDefaultTemplate
} = require('../controllers/templateController');
const {
  uploadTemplate,
  updateMarkerMappings,
  previewTemplate,
  getAvailableMarkers
} = require('../controllers/smartTemplateController');
const { authMiddleware, demoMiddleware } = require('../middleware/auth');

// All template routes require authentication
router.use(authMiddleware);

// GET /api/templates
router.get('/', getTemplates);

// GET /api/templates/markers
router.get('/markers', getAvailableMarkers);

// GET /api/templates/:id
router.get('/:id', getTemplate);

// POST /api/templates
router.post('/', demoMiddleware, createTemplate);

// POST /api/templates/upload
router.post('/upload', demoMiddleware, uploadTemplate);

// PUT /api/templates/:id
router.put('/:id', demoMiddleware, updateTemplate);

// PUT /api/templates/:id/mappings
router.put('/:id/mappings', demoMiddleware, updateMarkerMappings);

// POST /api/templates/:id/preview
router.post('/:id/preview', previewTemplate);

// DELETE /api/templates/:id
router.delete('/:id', demoMiddleware, deleteTemplate);

// PUT /api/templates/:id/default
router.put('/:id/default', demoMiddleware, setDefaultTemplate);

module.exports = router;