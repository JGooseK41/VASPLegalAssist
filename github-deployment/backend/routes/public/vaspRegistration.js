const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { sendEmail } = require('../../services/emailService');

const prisma = new PrismaClient();

// POST /api/public/vasp-registration - Submit VASP self-registration
router.post('/', async (req, res) => {
  try {
    const {
      // VASP Info
      name,
      legalName,
      jurisdiction,
      complianceEmail,
      complianceContact,
      serviceAddress,
      phone,
      processingTime,
      preferredMethod,
      requiredDocument,
      infoTypes,
      acceptsUsService,
      hasOwnPortal,
      lawEnforcementUrl,
      notes,
      
      // Submitter Info
      submitterName,
      submitterEmail,
      submitterTitle,
      submitterPhone,
      templateUrls
    } = req.body;
    
    // Validate required fields
    if (!name || !legalName || !jurisdiction || !complianceEmail || !submitterEmail || !submitterName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'legalName', 'jurisdiction', 'complianceEmail', 'submitterEmail', 'submitterName']
      });
    }
    
    // Generate verification code
    const verificationCode = crypto.randomBytes(32).toString('hex');
    
    // Create submission
    const submission = await prisma.vaspSubmission.create({
      data: {
        submissionType: 'SELF_REGISTRATION',
        name,
        legal_name: legalName,
        jurisdiction,
        compliance_email: complianceEmail,
        compliance_contact: complianceContact,
        service_address: serviceAddress,
        phone,
        processing_time: processingTime || '5-10 business days',
        preferred_method: preferredMethod || 'email',
        required_document: requiredDocument,
        info_types: infoTypes || ['KYC', 'Transaction History'],
        accepts_us_service: acceptsUsService || false,
        has_own_portal: hasOwnPortal || false,
        law_enforcement_url: lawEnforcementUrl,
        notes,
        submitterName,
        submitterEmail,
        submitterTitle,
        submitterPhone,
        templateUrls: templateUrls || [],
        verificationCode,
        isVerified: false
      }
    });
    
    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-vasp-registration?code=${verificationCode}&id=${submission.id}`;
    
    await sendEmail({
      to: submitterEmail,
      subject: 'Verify Your VASP Registration - VASP Legal Assist',
      html: `
        <h2>Verify Your VASP Registration</h2>
        <p>Hello ${submitterName},</p>
        <p>Thank you for registering ${name} with VASP Legal Assist. This will help law enforcement officers submit compliant legal requests to your organization.</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Registration</a></p>
        <p>Or copy and paste this URL: ${verificationUrl}</p>
        <p>Once verified, your submission will be reviewed by our admin team.</p>
        <h3>Benefits of Registration:</h3>
        <ul>
          <li>Receive properly formatted legal requests</li>
          <li>Reduce back-and-forth with law enforcement</li>
          <li>Upload custom templates for officers to use</li>
          <li>Update your contact information anytime</li>
        </ul>
        <p>If you did not submit this registration, please ignore this email.</p>
        <p>Best regards,<br>VASP Legal Assist Team</p>
      `
    });
    
    res.json({
      message: 'Registration submitted successfully. Please check your email to verify your submission.',
      submissionId: submission.id
    });
  } catch (error) {
    console.error('VASP registration error:', error);
    res.status(500).json({ error: 'Failed to submit registration' });
  }
});

// GET /api/public/vasp-registration/verify - Verify email for VASP registration
router.get('/verify', async (req, res) => {
  try {
    const { code, id } = req.query;
    
    if (!code || !id) {
      return res.status(400).json({ error: 'Missing verification code or ID' });
    }
    
    const submission = await prisma.vaspSubmission.findFirst({
      where: {
        id,
        verificationCode: code,
        isVerified: false
      }
    });
    
    if (!submission) {
      return res.status(404).json({ error: 'Invalid or expired verification link' });
    }
    
    // Mark as verified
    await prisma.vaspSubmission.update({
      where: { id },
      data: { isVerified: true }
    });
    
    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'New VASP Self-Registration Pending Review',
        html: `
          <h2>New VASP Registration</h2>
          <p>A new VASP has self-registered and requires review:</p>
          <ul>
            <li><strong>VASP Name:</strong> ${submission.name}</li>
            <li><strong>Legal Name:</strong> ${submission.legal_name}</li>
            <li><strong>Jurisdiction:</strong> ${submission.jurisdiction}</li>
            <li><strong>Submitted By:</strong> ${submission.submitterName} (${submission.submitterEmail})</li>
          </ul>
          <p><a href="${process.env.FRONTEND_URL}/admin/vasp-submissions" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Submission</a></p>
        `
      });
    }
    
    res.json({ 
      message: 'Email verified successfully! Your submission is now pending admin review.',
      verified: true 
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Failed to verify registration' });
  }
});

// POST /api/public/vasp-registration/update-request - Request to update existing VASP info
router.post('/update-request', async (req, res) => {
  try {
    const {
      vaspId,
      updates,
      submitterName,
      submitterEmail,
      submitterTitle,
      reason
    } = req.body;
    
    // Validate
    if (!vaspId || !updates || !submitterEmail || !submitterName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if VASP exists
    const vasp = await prisma.vasp.findUnique({
      where: { id: parseInt(vaspId) }
    });
    
    if (!vasp) {
      return res.status(404).json({ error: 'VASP not found' });
    }
    
    // Create a comment with the update request
    const updateComment = await prisma.vaspComment.create({
      data: {
        vaspId: parseInt(vaspId),
        userId: null, // System comment
        content: `📋 Update Request from ${submitterName} (${submitterTitle || 'VASP Representative'}): ${reason || 'Requested updates to VASP information'}`,
        isUpdate: true
      }
    });
    
    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    
    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: `VASP Update Request - ${vasp.name}`,
        html: `
          <h2>VASP Update Request</h2>
          <p>${submitterName} has requested updates to ${vasp.name}:</p>
          <p><strong>Reason:</strong> ${reason || 'Not specified'}</p>
          <p><strong>Requested Updates:</strong></p>
          <pre>${JSON.stringify(updates, null, 2)}</pre>
          <p><strong>Contact:</strong> ${submitterEmail}</p>
        `
      });
    }
    
    res.json({
      message: 'Update request submitted successfully. Our team will review your request.',
      commentId: updateComment.id
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Failed to submit update request' });
  }
});

module.exports = router;