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
const { authMiddleware, demoMiddleware } = require('../middleware/auth');

// All template routes require authentication
router.use(authMiddleware);

// GET /api/templates
router.get('/', getTemplates);

// GET /api/templates/:id
router.get('/:id', getTemplate);

// POST /api/templates
router.post('/', demoMiddleware, createTemplate);

// PUT /api/templates/:id
router.put('/:id', demoMiddleware, updateTemplate);

// DELETE /api/templates/:id
router.delete('/:id', demoMiddleware, deleteTemplate);

// PUT /api/templates/:id/default
router.put('/:id/default', demoMiddleware, setDefaultTemplate);

module.exports = router;