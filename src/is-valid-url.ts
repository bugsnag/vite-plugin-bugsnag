const isValidUrl = (urlString = '') => {
    try { 
        const { protocol } = new URL(urlString); 
        return protocol === 'http:' || protocol === 'https:';
    } catch { 
        return false 
    }
}

export default isValidUrl
  