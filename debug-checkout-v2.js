const fs = require('fs');

async function testCheckout() {
  try {
    console.log("=== TESTING CHECKOUT API ===");
    
    const response = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4NjdjMjViMy02ZDBmLTRlYTUtYmZiZC1mMDBlODY3ZWM2ODQiLCJlbWFpbCI6ImN1b25nQGdtYWlsLmNvbSIsInJvbGUiOiJlbXBsb3llZSIsIm5hbWUiOiJDdW9uZyIsImlhdCI6MTcyNjE0MjU5NCwiZXhwIjoxNzI2MjI4OTk0fQ.Lhy4q1Mu2r-sHePLCZlJQh-BFWa_4ue2V8aHnhkOA30'
      },
      body: JSON.stringify({
        checkoutTime: "20:35"
      })
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log("Response body:", JSON.stringify(result, null, 2));
    
    // Save to file for analysis
    fs.writeFileSync('checkout-test-result.json', JSON.stringify(result, null, 2));
    console.log("Result saved to checkout-test-result.json");
    
  } catch (error) {
    console.error("Test error:", error);
  }
}

testCheckout();
