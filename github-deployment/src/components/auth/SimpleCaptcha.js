import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const SimpleCaptcha = ({ onVerify }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState('');
  
  // Generate random captcha text
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid similar looking characters
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setError('');
  };
  
  useEffect(() => {
    generateCaptcha();
  }, []);
  
  // Draw captcha on canvas
  useEffect(() => {
    const canvas = document.getElementById('captcha-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
    
    // Add dots
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Draw text
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw each character with slight rotation and position variation
    const charWidth = canvas.width / (captchaText.length + 1);
    for (let i = 0; i < captchaText.length; i++) {
      ctx.save();
      const x = charWidth * (i + 1);
      const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.3);
      ctx.fillText(captchaText[i], 0, 0);
      ctx.restore();
    }
  }, [captchaText]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (userInput.toUpperCase() === captchaText) {
      onVerify(true);
      setError('');
    } else {
      setError('Incorrect CAPTCHA. Please try again.');
      generateCaptcha();
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Human Verification Required
        </label>
        <div className="flex items-center space-x-4">
          <canvas
            id="captcha-canvas"
            width="200"
            height="80"
            className="border border-gray-300 rounded-md bg-gray-100"
          />
          <button
            type="button"
            onClick={generateCaptcha}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Generate new CAPTCHA"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter the characters above"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Verify
        </button>
      </form>
      
      <p className="text-xs text-gray-500 text-center">
        This helps us prevent automated access to demo accounts
      </p>
    </div>
  );
};

export default SimpleCaptcha;