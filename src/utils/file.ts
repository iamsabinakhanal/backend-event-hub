/**
 * Convert file path to public upload URL
 */
export const toPublicUploadUrl = (filePath: string): string => {
    // Remove backslashes and convert to forward slashes for URL
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // If path already contains /uploads/, extract from that point
    if (normalizedPath.includes('/uploads/')) {
        return normalizedPath.substring(normalizedPath.indexOf('/uploads/'));
    }
    
    // If path starts with uploads (without leading slash), prepend slash
    if (normalizedPath.startsWith('uploads/')) {
        return '/' + normalizedPath;
    }
    
    // Otherwise prepend /uploads/ but keep subdirectory structure
    // Extract the relative path after removing any absolute path prefix
    const parts = normalizedPath.split('/');
    const uploadsIndex = parts.indexOf('uploads');
    if (uploadsIndex >= 0) {
        return '/' + parts.slice(uploadsIndex).join('/');
    }
    
    // Fallback: prepend /uploads/ and keep full path
    return `/uploads/${normalizedPath}`;
};

/**
 * Get the relative upload path from full file path
 */
export const getUploadRelativePath = (filePath: string): string => {
    return filePath.replace(/\\/g, '/');
};
