const supabase = require('../config/supabase');

const {
  registerPharmacyUser,
  loginUser,
} = require('../services/authService');


// ======================================================
// REGISTER
// ======================================================

const register = async (req, res) => {
  try {
    const {
      email,
      password,
      pharmacyName,
      ownerName,
      phone,
      address,
      gstin,
      licenseNumber,
      role,
    } = req.body;

    const licenseFile = req.file;

    // -----------------------------
    // Validation
    // -----------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (!pharmacyName) {
      return res.status(400).json({
        success: false,
        message: 'Pharmacy name is required',
      });
    }

    if (!ownerName) {
      return res.status(400).json({
        success: false,
        message: 'Owner name is required',
      });
    }

    if (!licenseNumber) {
      return res.status(400).json({
        success: false,
        message: 'Drug license number is required',
      });
    }

    if (!licenseFile) {
      return res.status(400).json({
        success: false,
        message: 'Drug license file is required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // -----------------------------
    // Create pharmacy account
    // -----------------------------

    const result = await registerPharmacyUser({
      email: email.trim().toLowerCase(),
      password,

      pharmacyName:
        pharmacyName.trim(),

      ownerName:
        ownerName.trim(),

      phone:
        phone?.trim() || null,

      address:
        address?.trim() || null,

      gstin:
        gstin?.trim().toUpperCase() || null,

      licenseNumber:
        licenseNumber.trim(),

      role:
        role || 'pharmacy',

      licenseFile,
    });

    // -----------------------------
    // Success response
    // -----------------------------

    return res.status(201).json({
      success: true,
      message: 'Pharmacy account created successfully',

      token:
        result.session?.access_token || null,

      refreshToken:
        result.session?.refresh_token || null,

      user:
        result.user,
    });

  } catch (error) {
    console.error('Registration error:', error);

    return res.status(400).json({
      success: false,
      message:
        error.message || 'Registration failed',
    });
  }
};


// ======================================================
// LOGIN
// ======================================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // -----------------------------
    // Authenticate user
    // -----------------------------

    const result = await loginUser(
      email.trim().toLowerCase(),
      password
    );

    // -----------------------------
    // Success response
    // -----------------------------

    return res.status(200).json({
      success: true,
      message: 'Login successful',

      token:
        result.session?.access_token || null,

      refreshToken:
        result.session?.refresh_token || null,

      user:
        result.user,
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(401).json({
      success: false,
      message:
        error.message || 'Login failed',
    });
  }
};


// ======================================================
// LOGOUT
// ======================================================

const logout = async (req, res) => {
  try {
    /*
     * The frontend removes the stored access token.
     * Supabase access tokens are short-lived, so there
     * is no need to maintain a server-side session here.
     */

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('Logout error:', error);

    return res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};


// ======================================================
// GET CURRENT USER
// ======================================================

const getCurrentUser = async (req, res) => {
  try {
    /*
     * authMiddleware already verified the token
     * and attached the authenticated Supabase user
     * to req.authUser.
     */

    const authUser = req.authUser;

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user not found',
      });
    }

    // -----------------------------
    // Get profile + pharmacy
    // -----------------------------

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        role,
        pharmacy_id,
        pharmacies (
          id,
          pharmacy_name,
          license_number,
          license_file_path,
          address,
          phone,
          email,
          gstin,
          is_active
        )
      `)
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.error(
        'Profile lookup error:',
        profileError
      );

      return res.status(404).json({
        success: false,
        message:
          `User profile not found: ${profileError.message}`,
      });
    }

    const pharmacy = profile.pharmacies;

    // -----------------------------
    // Check pharmacy status
    // -----------------------------

    if (
      profile.role === 'PHARMACY' &&
      pharmacy &&
      pharmacy.is_active === false
    ) {
      return res.status(403).json({
        success: false,
        message: 'This pharmacy account is inactive',
      });
    }

    // -----------------------------
    // Return current user
    // -----------------------------

    return res.status(200).json({
      success: true,

      user: {
        id: authUser.id,

        email:
          authUser.email,

        role:
          profile.role,

        pharmacyId:
          profile.pharmacy_id,

        pharmacyName:
          pharmacy?.pharmacy_name || null,

        ownerName:
          profile.full_name,

        phone:
          pharmacy?.phone || null,

        address:
          pharmacy?.address || null,

        gstin:
          pharmacy?.gstin || null,

        licenseNumber:
          pharmacy?.license_number || null,
      },
    });

  } catch (error) {
    console.error(
      'Get current user error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        'Unable to get current user',
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};