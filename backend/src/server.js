require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const supabase = require('./config/supabase');

const dashboardRoutes = require('./routes/dashboardRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);


// ======================================================
// AUTH ROUTES
// ======================================================

app.use('/api/auth', authRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PharmaNexus backend is running',
  });
});


// ======================================================
// SUPABASE CONNECTION TEST
// ======================================================

app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pharmacies')
      .select('id')
      .limit(1);

    if (error) {
      console.error(
        'Supabase query error:',
        error
      );

      return res.status(500).json({
        success: false,
        message: 'Supabase connection/query failed',
        error: error.message,
      });
    }

    return res.json({
      success: true,
      message: 'Supabase connection is working',
      data,
    });

  } catch (error) {
    console.error(
      'Database test error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message,
    });
  }
});


// ======================================================
// TEMPORARY PROFILES TABLE TEST
// ======================================================

app.get('/api/test-profile-db', async (req, res) => {
  try {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        role,
        pharmacy_id
      `)
      .limit(5);

    if (error) {
      console.error(
        'Profiles test error:',
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: 'Profiles table query is working',
      data,
    });

  } catch (error) {
    console.error(
      'Profiles test exception:',
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {
  console.log(
    `PharmaNexus backend running on http://localhost:${PORT}`
  );
});