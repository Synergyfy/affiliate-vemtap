
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dnejwzsgy',
  api_key: '779662146815654',
  api_secret: '2PZO5z9W36HDtd9SjU5ZjeEgyoA',
});

cloudinary.api.ping()
  .then(result => {
    console.log('Cloudinary Ping Result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Cloudinary Ping Error:', error);
    process.exit(1);
  });
