/**
 * Utility to validate Indian pincodes and fetch district information
 */

// Common Saharsa district pincodes (for faster validation)
const SAHARSA_PINCODES = {
  // Saharsa town area
  '852201': 'Saharsa',
  // Add more as needed
};

// Common district prefixes for Indian pincodes (optional fallback)
const DISTRICT_MAPPING = {
  'Saharsa': ['852201', '852202', '852203', '852204'],
};

/**
 * Try to validate pincode and fetch district
 * @param {string} pincode - 6-digit Indian pincode
 * @returns {Promise<{ valid: boolean, district: string | null, pincode: string }>}
 */
async function validateAndFetchDistrict(pincode) {
  try {
    // First check if it's in our local cache
    if (SAHARSA_PINCODES[pincode]) {
      return {
        valid: true,
        district: SAHARSA_PINCODES[pincode],
        pincode
      };
    }

    // Try the postalpincode.in API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const district = data[0].PostOffice[0].District || '';
        return {
          valid: true,
          district: district,
          pincode
        };
      }

      return {
        valid: false,
        district: null,
        pincode
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.warn(`Pincode validation timeout for ${pincode}`);
      }
      throw error;
    }
  } catch (error) {
    console.warn(`Error validating pincode ${pincode}:`, error.message);
    return {
      valid: false,
      district: null,
      pincode,
      error: error.message
    };
  }
}

/**
 * Check if pincode belongs to Saharsa district
 * @param {string} pincode - 6-digit Indian pincode
 * @returns {Promise<boolean>}
 */
async function isSaharsaPincode(pincode) {
  const result = await validateAndFetchDistrict(pincode);
  return result.valid && result.district && result.district.toLowerCase() === 'saharsa';
}

/**
 * Ensure address has valid district info (fetch if missing)
 * @param {Object} address - Address object
 * @returns {Promise<Object>} - Address with district populated
 */
async function enrichAddressWithDistrict(address) {
  // If district is already present and not empty, return as-is
  if (address.district && address.district.trim()) {
    return address;
  }

  // If no pincode, can't fetch district
  if (!address.pincode || !address.pincode.trim()) {
    return address;
  }

  try {
    // Wrap with timeout to prevent hanging
    const result = await Promise.race([
      validateAndFetchDistrict(address.pincode),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pincode validation timeout')), 3000)
      )
    ]);
    
    if (result.valid && result.district) {
      return {
        ...address,
        district: result.district
      };
    }
  } catch (error) {
    console.warn('Error enriching address:', error.message);
  }

  return address;
}

module.exports = {
  validateAndFetchDistrict,
  isSaharsaPincode,
  enrichAddressWithDistrict,
  SAHARSA_PINCODES
};
