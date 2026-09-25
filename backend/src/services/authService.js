const { createClient } = require('@supabase/supabase-js');

const supabase = require('../config/supabase');
const supabaseAuth = require('../config/supabaseAuth');


// ======================================================
// ROLE MAP
// ======================================================

const ROLE_MAP = {
  pharmacy: 'PHARMACY',
  pharmacist: 'PHARMACY',
  distributor: 'DISTRIBUTOR',
  admin: 'ADMIN',
};


// ======================================================
// NORMALIZE ROLE
// ======================================================

const normalizeRole = (role) => {
  if (!role) {
    return null;
  }

  return (
    ROLE_MAP[String(role).toLowerCase()] || null
  );
};


// ======================================================
// REGISTER PHARMACY USER
// ======================================================

const registerPharmacyUser = async (userData) => {
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
    licenseFile,
  } = userData;

  const normalizedRole = normalizeRole(role);

  if (!normalizedRole) {
    throw new Error('Invalid user role');
  }

  if (normalizedRole !== 'PHARMACY') {
    throw new Error(
      'Only pharmacy registration is currently available'
    );
  }

  if (!licenseFile) {
    throw new Error(
      'Drug license file is required'
    );
  }

  // --------------------------------------------------
  // 1. Create Supabase Auth user
  // --------------------------------------------------

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  const authUser = authData.user;

  if (!authUser) {
    throw new Error(
      'Unable to create authentication user'
    );
  }

  let licenseFilePath = null;

  try {
    // --------------------------------------------------
    // 2. Upload drug license
    // --------------------------------------------------

    if (licenseFile) {
      const originalName =
        licenseFile.originalname || 'license';

      const safeFileName = originalName
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\s+/g, '_');

      licenseFilePath =
        `${authUser.id}/${Date.now()}-${safeFileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from('drug-licenses')
        .upload(
          licenseFilePath,
          licenseFile.buffer,
          {
            contentType: licenseFile.mimetype,
            upsert: false,
          }
        );

      if (uploadError) {
        throw new Error(
          `Drug license upload failed: ${uploadError.message}`
        );
      }
    }

    // --------------------------------------------------
    // 3. Create pharmacy
    // --------------------------------------------------

    const {
      data: pharmacy,
      error: pharmacyError,
    } = await supabase
      .from('pharmacies')
      .insert({
        pharmacy_name: pharmacyName,
        license_number:
          licenseNumber || null,
        license_file_path:
          licenseFilePath,
        address:
          address || null,
        phone:
          phone || null,
        email,
        gstin:
          gstin || null,
      })
      .select()
      .single();

    if (pharmacyError) {
      throw new Error(
        pharmacyError.message
      );
    }

    // --------------------------------------------------
    // 4. Create profile
    // --------------------------------------------------

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .insert({
        id: authUser.id,
        full_name: ownerName,
        email,
        role: normalizedRole,
        pharmacy_id: pharmacy.id,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(
        profileError.message
      );
    }

    // --------------------------------------------------
    // 5. Sign in after registration
    // --------------------------------------------------

    const {
      data: sessionData,
      error: sessionError,
    } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      throw new Error(
        sessionError.message
      );
    }

    // --------------------------------------------------
    // 6. Return user + session
    // --------------------------------------------------

    return {
      user: {
        id: authUser.id,
        email: authUser.email,
        role: profile.role,

        pharmacyId:
          pharmacy.id,

        pharmacyName:
          pharmacy.pharmacy_name,

        ownerName:
          profile.full_name,

        phone:
          pharmacy.phone,

        address:
          pharmacy.address,

        gstin:
          pharmacy.gstin,

        licenseNumber:
          pharmacy.license_number,
      },

      session:
        sessionData.session,
    };

  } catch (error) {

    // --------------------------------------------------
    // Cleanup uploaded license
    // --------------------------------------------------

    if (licenseFilePath) {
      try {
        await supabase.storage
          .from('drug-licenses')
          .remove([
            licenseFilePath,
          ]);
      } catch (cleanupError) {
        console.error(
          'License file cleanup failed:',
          cleanupError.message
        );
      }
    }

    // --------------------------------------------------
    // Cleanup Auth user
    // --------------------------------------------------

    try {
      await supabase.auth.admin.deleteUser(
        authUser.id
      );
    } catch (cleanupError) {
      console.error(
        'Auth user cleanup failed:',
        cleanupError.message
      );
    }

    throw error;
  }
};


// ======================================================
// LOGIN
// ======================================================

const loginUser = async (
  email,
  password
) => {

  // --------------------------------------------------
  // 1. Authenticate using separate Auth client
  // --------------------------------------------------

  const {
    data: sessionData,
    error: sessionError,
  } =
    await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

  if (sessionError) {
    throw new Error(
      sessionError.message
    );
  }

  const authUser =
    sessionData.user;

  if (!authUser) {
    throw new Error(
      'Unable to authenticate user'
    );
  }

  // --------------------------------------------------
  // 2. Create a completely fresh database client
  // --------------------------------------------------

  const databaseClient =
    createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    );

  // --------------------------------------------------
  // 3. Get profile + pharmacy
  // --------------------------------------------------

  const {
    data: profile,
    error: profileError,
  } =
    await databaseClient
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
      .eq(
        'id',
        authUser.id
      )
      .single();

  if (profileError) {
    console.error(
      'Profile database query error:',
      profileError
    );

    throw new Error(
      `User profile not found: ${profileError.message}`
    );
  }

  const pharmacy =
    profile.pharmacies;

  // --------------------------------------------------
  // 4. Check pharmacy status
  // --------------------------------------------------

  if (
    profile.role === 'PHARMACY' &&
    pharmacy &&
    pharmacy.is_active === false
  ) {
    throw new Error(
      'This pharmacy account is inactive'
    );
  }

  // --------------------------------------------------
  // 5. Return authenticated user
  // --------------------------------------------------

  return {
    user: {
      id: authUser.id,

      email:
        authUser.email,

      role:
        profile.role,

      pharmacyId:
        profile.pharmacy_id,

      pharmacyName:
        pharmacy?.pharmacy_name ||
        null,

      ownerName:
        profile.full_name,

      phone:
        pharmacy?.phone ||
        null,

      address:
        pharmacy?.address ||
        null,

      gstin:
        pharmacy?.gstin ||
        null,

      licenseNumber:
        pharmacy?.license_number ||
        null,
    },

    session:
      sessionData.session,
  };
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  normalizeRole,
  registerPharmacyUser,
  loginUser,
};