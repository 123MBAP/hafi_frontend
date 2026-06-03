export const uploadServiceImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
  
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
  
      if (!response.ok) {
        throw new Error('Image upload failed');
      }
  
      const { url } = await response.json();
      return url;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload image. Please try again.');
    }
  };