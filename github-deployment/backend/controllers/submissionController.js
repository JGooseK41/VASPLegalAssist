const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new VASP submission
const createSubmission = async (req, res) => {
  try {
    const submission = await prisma.vaspSubmission.create({
      data: {
        userId: req.userId,
        vaspName: req.body.name || req.body.vaspName,
        legalName: req.body.legal_name || req.body.legalName,
        jurisdiction: req.body.jurisdiction,
        complianceEmail: req.body.compliance_email || req.body.complianceEmail,
        complianceContact: req.body.compliance_contact || req.body.complianceContact,
        serviceAddress: req.body.service_address || req.body.serviceAddress,
        phone: req.body.phone,
        processingTime: req.body.processing_time || req.body.processingTime || '5-10 business days',
        preferredMethod: req.body.preferred_method || req.body.preferredMethod,
        requiredDocument: req.body.required_document || req.body.requiredDocument,
        infoTypes: req.body.info_types || req.body.infoTypes || ['KYC', 'Transaction History'],
        serviceTypes: req.body.service_types || req.body.serviceTypes || [],
        acceptsUsService: req.body.accepts_us_service || req.body.acceptsUsService || false,
        hasOwnPortal: req.body.has_own_portal || req.body.hasOwnPortal || false,
        lawEnforcementUrl: req.body.law_enforcement_url || req.body.lawEnforcementUrl,
        notes: req.body.notes
      }
    });
    
    res.status(201).json({
      message: 'VASP submission created successfully. It will be reviewed by an admin.',
      submission
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
};

// Get user's own submissions
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await prisma.vaspSubmission.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
};

// Get a specific submission (only if owned by user)
const getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    const submission = await prisma.vaspSubmission.findFirst({
      where: {
        id: submissionId,
        userId: req.userId
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
};

// Update a pending submission
const updateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Check if submission exists and is owned by user
    const existingSubmission = await prisma.vaspSubmission.findFirst({
      where: {
        id: submissionId,
        userId: req.userId,
        status: 'PENDING'
      }
    });
    
    if (!existingSubmission) {
      return res.status(404).json({ error: 'Submission not found or cannot be edited' });
    }
    
    const updatedSubmission = await prisma.vaspSubmission.update({
      where: { id: submissionId },
      data: {
        vaspName: req.body.name || req.body.vaspName,
        legalName: req.body.legal_name || req.body.legalName,
        jurisdiction: req.body.jurisdiction,
        complianceEmail: req.body.compliance_email || req.body.complianceEmail,
        complianceContact: req.body.compliance_contact || req.body.complianceContact,
        serviceAddress: req.body.service_address || req.body.serviceAddress,
        phone: req.body.phone,
        processingTime: req.body.processing_time || req.body.processingTime,
        preferredMethod: req.body.preferred_method || req.body.preferredMethod,
        requiredDocument: req.body.required_document || req.body.requiredDocument,
        infoTypes: req.body.info_types || req.body.infoTypes,
        serviceTypes: req.body.service_types || req.body.serviceTypes || [],
        acceptsUsService: req.body.accepts_us_service || req.body.acceptsUsService,
        hasOwnPortal: req.body.has_own_portal || req.body.hasOwnPortal,
        lawEnforcementUrl: req.body.law_enforcement_url || req.body.lawEnforcementUrl,
        notes: req.body.notes
      }
    });
    
    res.json({
      message: 'Submission updated successfully',
      submission: updatedSubmission
    });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
};

// Delete a pending submission
const deleteSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // Check if submission exists and is owned by user
    const submission = await prisma.vaspSubmission.findFirst({
      where: {
        id: submissionId,
        userId: req.userId,
        status: 'PENDING'
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found or cannot be deleted' });
    }
    
    await prisma.vaspSubmission.delete({
      where: { id: submissionId }
    });
    
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
};

module.exports = {
  createSubmission,
  getMySubmissions,
  getSubmission,
  updateSubmission,
  deleteSubmission
};