// Replace these with your actual EmailJS credentials
const EMAILJS_SERVICE_ID  = 'service_8cm8kv4';
const EMAILJS_TEMPLATE_ID = 'template_o26t0nf';
const EMAILJS_PUBLIC_KEY  = 'KyRvCY2eH-8-sHfl-';

// Initialize EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// Send booking confirmation email
async function sendBookingEmail(bookingDetails) {
  const user = getUser();
  if (!user || !user.email) return;

  const templateParams = {
    to_name:      user.name,
    to_email:     user.email,
    status:       'Confirmed ✅',
    pickup:       bookingDetails.pickup,
    drop:         bookingDetails.drop,
    service_type: bookingDetails.serviceType === 'pickup_drop'
                  ? 'Vehicle Pickup & Drop'
                  : 'Driver With Client',
    fare:         bookingDetails.fare,
    datetime:     new Date(bookingDetails.datetime).toLocaleString(),
    driver_info:  '🔐 Your Confirmation OTP: ' + bookingDetails.confirmOTP +
                  '\n\nShow this OTP to your driver when they arrive to start the trip.'
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    console.log('✅ Booking confirmation email sent!');
  } catch (err) {
    console.log('Email error:', err);
  }
}
// Send driver accepted email
async function sendDriverAcceptedEmail(bookingDetails, driverName) {
  const user = getUser();
  if (!user || !user.email) return;

  const templateParams = {
    to_name:     user.name,
    to_email:    user.email,
    status:      'Accepted by Driver ✅',
    pickup:      bookingDetails.pickup,
    drop:        bookingDetails.drop,
    service_type: bookingDetails.serviceType === 'pickup_drop'
                  ? 'Vehicle Pickup & Drop'
                  : 'Driver With Client',
    fare:        bookingDetails.fare,
    datetime:    new Date(bookingDetails.datetime).toLocaleString(),
    driver_info: `Your driver is: ${driverName}`
  };

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );
    console.log('✅ Driver accepted email sent!');
  } catch (err) {
    console.log('Email error:', err);
  }
}