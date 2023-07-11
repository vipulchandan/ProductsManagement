const AWS = require('aws-sdk');

// AWS configuration
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "ap-south-1"
});

// S3 configuration for upload image - User Profile Image
const uploadUserProfile = async (file) => {
    try {
      const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  
      const uploadParams = {
        ACL: 'public-read',
        Bucket: 'classroom-training-bucket',
        Key: 'user/' + file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype
      };
  
      const uploadResult = await s3.upload(uploadParams).promise();
  
      console.log(uploadResult);
      console.log('File uploaded successfully');
  
      return uploadResult.Location;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
};

// S3 configuration for upload image - Product Image
const uploadProductImage = async (file) => {
    try {
      const s3 = new AWS.S3({ apiVersion: '2006-03-01' });
  
      const uploadParams = {
        ACL: 'public-read',
        Bucket: 'classroom-training-bucket',
        Key: 'product/' + file.originalname,
        Body: file.buffer,
        ContentType: file.mimetype
      };
  
      const uploadResult = await s3.upload(uploadParams).promise();
  
      console.log(uploadResult);
      console.log('File uploaded successfully');
  
      return uploadResult.Location;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
};

module.exports = {
    uploadUserProfile,
    uploadProductImage
}