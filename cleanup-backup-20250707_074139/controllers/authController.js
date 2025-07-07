const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: role === 'DEMO' ? '1h' : '7d'
  });
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, agencyName, badgeNumber, title, phone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        agencyName,
        badgeNumber,
        title,
        phone
      }
    });

    // Create default templates for new user
    await createDefaultTemplates(user.id);

    // Generate token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        agencyName: user.agencyName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for demo account
    if (email === process.env.DEMO_EMAIL && password === process.env.DEMO_PASSWORD) {
      const demoUser = {
        id: 'demo-user-id',
        email: process.env.DEMO_EMAIL,
        firstName: 'Demo',
        lastName: 'User',
        agencyName: 'Demo Law Enforcement Agency',
        badgeNumber: 'DEMO-001',
        role: 'DEMO'
      };

      const token = generateToken(demoUser.id, demoUser.role);
      
      return res.json({
        user: demoUser,
        token
      });
    }

    // Regular user login
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        agencyName: user.agencyName,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

const createDefaultTemplates = async (userId) => {
  const defaultTemplates = [
    {
      userId,
      templateType: 'LETTERHEAD',
      templateName: 'Default Letterhead',
      agencyHeader: '[Agency Name]\n[Agency Address]',
      agencyAddress: '[Street Address]\n[City, State ZIP]',
      agencyContact: 'Phone: [Phone]\nEmail: [Email]',
      footerText: 'This document is an official law enforcement request. Please respond within the specified timeframe.',
      signatureBlock: '[Name]\n[Title]\n[Badge Number]',
      isDefault: true
    },
    {
      userId,
      templateType: 'SUBPOENA',
      templateName: 'Default Subpoena',
      agencyHeader: 'UNITED STATES DISTRICT COURT\n[District Name]',
      agencyAddress: '[Court Address]',
      agencyContact: 'Case No: [Case Number]',
      footerText: 'Failure to comply with this subpoena may result in contempt of court.',
      signatureBlock: '[Name]\n[Title]\nUnited States [Agency]',
      isDefault: true
    }
  ];

  await prisma.documentTemplate.createMany({
    data: defaultTemplates
  });
};

module.exports = {
  register,
  login
};