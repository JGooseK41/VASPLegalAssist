// Utility to parse rich text JSON structures (like from Wix) into plain text
export const parseRichTextNotes = (notes) => {
  if (!notes) return '';
  
  // If it's already plain text, return as-is
  if (typeof notes === 'string' && !notes.trim().startsWith('{')) {
    return notes;
  }
  
  try {
    // Try to parse as JSON
    const parsed = typeof notes === 'string' ? JSON.parse(notes) : notes;
    
    // Handle Wix-style rich text structure
    if (parsed.nodes && Array.isArray(parsed.nodes)) {
      return extractTextFromNodes(parsed.nodes);
    }
    
    // If it's some other JSON structure, just stringify it
    return JSON.stringify(parsed);
  } catch (e) {
    // If parsing fails, return the original string
    return notes;
  }
};

// Recursively extract text from node structure
const extractTextFromNodes = (nodes) => {
  let text = '';
  
  for (const node of nodes) {
    if (node.type === 'TEXT' && node.textData?.text) {
      text += node.textData.text;
    } else if (node.nodes && Array.isArray(node.nodes)) {
      text += extractTextFromNodes(node.nodes);
    }
  }
  
  return text.trim();
};

// Also export a function to check if a string contains rich text JSON
export const isRichTextJson = (text) => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.startsWith('{') && trimmed.includes('"nodes"');
};