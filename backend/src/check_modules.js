try {
    console.log('Checking emailService...');
    require('./services/emailService');
    console.log('✓ emailService OK');

    console.log('Checking profileController...');
    require('./controllers/profileController');
    console.log('✓ profileController OK');

    console.log('Checking profile routes...');
    require('./routes/profile');
    console.log('✓ profile routes OK');

    console.log('Checking app...');
    require('./app'); // This will try to listen to port, might fail if port used, but we want to check requires first
    console.log('✓ app OK');

} catch (e) {
    console.error('ERROR LOADING MODULE:', e);
}
