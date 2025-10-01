import axios from 'axios';

export const generateOTP = () => {
  // Generate a 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTPViaSMS = async (phoneNumber, otp) => {
    try {
      // Automatically add +91 if not provided for Indian numbers
      const formattedPhoneNumber = phoneNumber.startsWith('+91')
        ? phoneNumber
        : `+91${phoneNumber}`;
  
      const response = await axios.post('http://localhost:8000/send-otp', {
        phoneNumber: formattedPhoneNumber,
        otp,
      });
  
      return response.status === 200;
    } catch (error) {
      console.error('Error sending OTP:', error);
      return false;
    }
  };
  
  

export const verifyOTP = (enteredOTP, generatedOTP) => {
  // Check if the entered OTP matches the generated OTP
  return enteredOTP === generatedOTP;
};
